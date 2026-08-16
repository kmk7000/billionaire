import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // No window is built here on purpose.
        //
        // The scene manifest sets UISceneStoryboardFile = Main, so UIKit has
        // already instantiated Main.storyboard's initial view controller and
        // installed it in a window before this method is called — verified on
        // device by logging `window` on entry. Creating a second window here
        // left the app with *two* CAPBridgeViewControllers, each with its own
        // webview running the JS, and only one of them carrying the app-target
        // plugin registration. Whichever window ended up key decided whether
        // CallerIdIndex existed, which is why the simulator worked and the
        // phone answered {"code":"UNIMPLEMENTED"}.
        //
        // The storyboard now names MainViewController directly, so the single
        // root controller UIKit creates is the one that registers the plugin.
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
