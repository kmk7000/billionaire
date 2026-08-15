# One-time migration: adds the CallDirectoryExtension target to App.xcodeproj
# and wires the App target to use it (entitlements, embed phase, dependency).
#
# Run once via: ruby ios/add_call_directory_extension.rb
# Safe to re-run — it no-ops anything it finds already in place.
#
# What it cannot do: register the App Group with your Apple Developer account.
# That happens automatically the first time you build in Xcode while signed
# into a team (CODE_SIGN_STYLE is Automatic on both targets), or you can add
# it by hand via Signing & Capabilities > + Capability > App Groups.

require 'xcodeproj'

project_path = File.join(__dir__, 'App', 'App.xcodeproj')
project = Xcodeproj::Project.open(project_path)

app_target = project.targets.find { |t| t.name == 'App' }
raise 'App target not found' unless app_target

if project.targets.any? { |t| t.name == 'CallDirectoryExtension' }
  puts 'CallDirectoryExtension target already exists — nothing to do.'
  exit 0
end

DEPLOYMENT_TARGET = app_target.build_configurations.first.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] || '15.0'
SWIFT_VERSION = app_target.build_configurations.first.build_settings['SWIFT_VERSION'] || '5.0'

# --- Group + file references ------------------------------------------------

ext_group = project.main_group.new_group('CallDirectoryExtension', 'CallDirectoryExtension')
handler_ref = ext_group.new_file('CallDirectoryHandler.swift')
ext_plist_ref = ext_group.new_file('Info.plist')
ext_entitlements_ref = ext_group.new_file('CallDirectoryExtension.entitlements')

# The plugin file already exists on disk (ios/App/App/Plugins/...); it just
# needs a project reference so Xcode actually compiles it into the App target.
app_inner_group = project.main_group['App']['App']
plugins_group = app_inner_group['Plugins'] || app_inner_group.new_group('Plugins', 'Plugins')
plugin_ref = plugins_group.new_file('CallerIdIndexPlugin.swift') unless plugins_group.files.any? { |f| f.display_name == 'CallerIdIndexPlugin.swift' }
app_entitlements_ref = app_inner_group.new_file('App.entitlements') unless app_inner_group.files.any? { |f| f.display_name == 'App.entitlements' }

# --- New target --------------------------------------------------------------

ext_target = project.new_target(:app_extension, 'CallDirectoryExtension', :ios, DEPLOYMENT_TARGET)
ext_target.source_build_phase.add_file_reference(handler_ref)

ext_target.build_configurations.each do |config|
  config.build_settings.merge!(
    'PRODUCT_BUNDLE_IDENTIFIER' => 'com.billionaire.app.CallDirectoryExtension',
    'PRODUCT_NAME' => '$(TARGET_NAME)',
    'INFOPLIST_FILE' => 'CallDirectoryExtension/Info.plist',
    'CODE_SIGN_ENTITLEMENTS' => 'CallDirectoryExtension/CallDirectoryExtension.entitlements',
    'CODE_SIGN_STYLE' => 'Automatic',
    'SWIFT_VERSION' => SWIFT_VERSION,
    'IPHONEOS_DEPLOYMENT_TARGET' => DEPLOYMENT_TARGET,
    'TARGETED_DEVICE_FAMILY' => '1,2',
    'MARKETING_VERSION' => '1.0',
    'CURRENT_PROJECT_VERSION' => '1',
    'SKIP_INSTALL' => 'YES',
    'GENERATE_INFOPLIST_FILE' => 'NO'
  )
end

# --- Embed the extension in the app ------------------------------------------

embed_phase = app_target.copy_files_build_phases.find { |p| p.name == 'Embed App Extensions' }
embed_phase ||= app_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.dst_subfolder_spec = '13' # PlugIns
embed_phase.symbol_dst_subfolder_spec = :plug_ins
build_file = embed_phase.add_file_reference(ext_target.product_reference)
build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

app_target.add_dependency(ext_target)

# --- App target: point at its own entitlements file --------------------------

app_target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
end

project.save

puts 'Added CallDirectoryExtension target and wired it to App.'
puts 'Next manual step (Xcode, one time): open App.xcodeproj, select each'
puts 'target > Signing & Capabilities, confirm a Team is selected, and add'
puts 'the "App Groups" capability with group.com.billionaire.app.callerid'
puts 'if Xcode does not pick up the entitlements file automatically.'
