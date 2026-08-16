import Capacitor
import CallKit
import UIKit

/// Bridges the web layer's saved-card phone index to the iOS Call Directory
/// Extension (`CallDirectoryExtension` target). That extension runs in its
/// own sandboxed process and cannot read the WebView, Firestore, or anything
/// else the JS side holds — this plugin is the only path the data can take:
/// JS sends a normalized [{number, label}] list here as a JSON string, this
/// writes it into an App Group container both processes can see, then asks
/// iOS to reload the extension.
///
/// "Asks" is the operative word. `reloadExtension` is a request; iOS decides
/// when the extension actually re-runs, based on its own battery/CPU budget.
/// A card saved just now may not be identifiable on an incoming call for a
/// while — there is no API to force immediacy, and the console/UI must not
/// imply otherwise.
@objc(CallerIdIndexPlugin)
public class CallerIdIndexPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CallerIdIndexPlugin"
    public let jsName = "CallerIdIndex"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "sync", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]

    /// Must match the App Group entitlement on both this target and the
    /// extension target, and the extension identifier in its Info.plist.
    private static let appGroupId = "group.com.billionaire.app.callerid"
    // Must track the CallDirectoryExtension target's PRODUCT_BUNDLE_IDENTIFIER
    // exactly — currently com.mingyukim.billionaire.* as a free-account
    // workaround (com.billionaire.app.* is already registered to someone
    // else globally). Revert both together if this moves to a paid team.
    private static let extensionId = "com.mingyukim.billionaire.CallDirectoryExtension"
    private static let storageKey = "callerIdEntries"

    /// `payload` is a JSON string (not a typed array) so this method's shape
    /// does not depend on which Capacitor version's `getArray` overloads are
    /// available — the JS side does `JSON.stringify([{number, label}, ...])`.
    @objc func sync(_ call: CAPPluginCall) {
        guard let payload = call.getString("payload"),
              let data = payload.data(using: .utf8),
              let raw = try? JSONSerialization.jsonObject(with: data) as? [[String: String]]
        else {
            call.reject("payload must be a JSON array of {number, label}")
            return
        }

        // Stored as "number|label" strings rather than an array of
        // dictionaries — App Group UserDefaults values must be plist types,
        // and this keeps the extension's parsing dependency-free.
        let lines: [String] = raw.compactMap { entry in
            guard let number = entry["number"], let label = entry["label"], !number.isEmpty else { return nil }
            return "\(number)|\(label)"
        }

        guard let defaults = UserDefaults(suiteName: Self.appGroupId) else {
            call.reject("Cannot access App Group '\(Self.appGroupId)'. Enable App Groups in Xcode Signing & Capabilities for both the App and CallDirectoryExtension targets.")
            return
        }
        defaults.set(lines, forKey: Self.storageKey)

        CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: Self.extensionId) { error in
            if let error = error {
                call.reject("Failed to reload the call directory extension: \(error.localizedDescription)")
            } else {
                call.resolve(["count": lines.count])
            }
        }
    }

    /// Reports both halves of "is this working": whether the user switched the
    /// extension on in iOS Settings, and whether our numbers actually reached
    /// the shared container. Without the second half a failed App Group setup
    /// is invisible — the extension reads an empty list and every call comes
    /// through unidentified with nothing to show for it.
    @objc func getStatus(_ call: CAPPluginCall) {
        let defaults = UserDefaults(suiteName: Self.appGroupId)
        let entryCount = defaults?.stringArray(forKey: Self.storageKey)?.count ?? 0

        CXCallDirectoryManager.sharedInstance.getEnabledStatusForExtension(withIdentifier: Self.extensionId) { status, error in
            let label: String
            switch status {
            case .enabled: label = "enabled"
            case .disabled: label = "disabled"
            default: label = "unknown"
            }

            // Resolving even when the query failed, rather than rejecting.
            // A rejection here is indistinguishable on the JS side from the
            // plugin being absent entirely, and the two need opposite advice:
            // one means the extension is not installed, the other means this
            // build cannot talk to it at all. The App Group answer is also
            // still true and useful regardless of what CallKit said.
            var result: [String: Any] = [
                "status": label,
                "appGroupAvailable": defaults != nil,
                "entryCount": entryCount
            ]
            if let error = error {
                result["error"] = error.localizedDescription
            }
            call.resolve(result)
        }
    }

    /// There is no public deep link straight to Settings > Phone > Call
    /// Blocking & Identification — only the Settings app root is reachable
    /// from a third-party app. The caller is responsible for telling the
    /// user where to tap next.
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                call.reject("Could not open Settings")
                return
            }
            UIApplication.shared.open(url, options: [:]) { success in
                success ? call.resolve() : call.reject("Could not open Settings")
            }
        }
    }
}
