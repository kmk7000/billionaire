import CallKit

/// CXCallDirectoryProvider implementation.
///
/// This runs in its own sandboxed process, invoked by iOS on iOS's own
/// schedule — never while the app is simply open in the foreground. It has
/// no access to the WebView, Firestore, or anything else the main app holds;
/// the only data it can see is what `CallerIdIndexPlugin` wrote into the
/// shared App Group container ahead of time.
class CallDirectoryHandler: CXCallDirectoryProvider {

    private static let appGroupId = "group.com.billionaire.app.callerid"
    private static let storageKey = "callerIdEntries"

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self

        do {
            try addIdentificationEntries(to: context)
        } catch {
            context.cancelRequest(withError: error)
            return
        }

        context.completeRequest()
    }

    private func addIdentificationEntries(to context: CXCallDirectoryExtensionContext) throws {
        guard let defaults = UserDefaults(suiteName: Self.appGroupId) else {
            // No App Group access means no data to load. An empty directory
            // is a valid (if useless) result, not a failure worth aborting on.
            return
        }
        let lines = defaults.stringArray(forKey: Self.storageKey) ?? []

        // Parse "number|label" and sort ascending: the system API requires
        // strictly ascending, non-duplicate phone numbers and aborts the
        // entire load on the first entry that violates that.
        var entries: [(number: CXCallDirectoryPhoneNumber, label: String)] = []
        for line in lines {
            let parts = line.split(separator: "|", maxSplits: 1)
            guard parts.count == 2, let number = CXCallDirectoryPhoneNumber(parts[0]) else { continue }
            entries.append((number, String(parts[1])))
        }
        entries.sort { $0.number < $1.number }

        var lastNumber: CXCallDirectoryPhoneNumber?
        for entry in entries {
            if entry.number == lastNumber { continue }
            context.addIdentificationEntry(withNextSequentialPhoneNumber: entry.number, label: entry.label)
            lastNumber = entry.number
        }
    }
}

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {
        // Nothing user-facing to do here — there is no channel back to the
        // main app from this process. iOS logs the failure and retries later
        // on its own schedule.
    }
}
