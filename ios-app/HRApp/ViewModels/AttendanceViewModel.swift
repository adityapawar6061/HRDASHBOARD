import Foundation
import UIKit

@MainActor
class AttendanceViewModel: ObservableObject {
    @Published var logs: [AttendanceLog] = []
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var successMessage = ""

    var isPunchedIn: Bool {
        get { UserDefaults.standard.bool(forKey: "is_punched_in") }
        set { UserDefaults.standard.set(newValue, forKey: "is_punched_in") }
    }

    func punchIn(lat: Double, lng: Double) async {
        isLoading = true
        errorMessage = ""
        let deviceInfo = DeviceInfo(
            deviceName: UIDevice.current.name,
            os: "iOS \(UIDevice.current.systemVersion)",
            deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "unknown"
        )
        do {
            _ = try await APIService.shared.punchIn(lat: lat, lng: lng, deviceInfo: deviceInfo)
            isPunchedIn = true
            successMessage = "Punched In Successfully!"
            await loadLogs()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func punchOut(lat: Double, lng: Double) async {
        isLoading = true
        errorMessage = ""
        do {
            _ = try await APIService.shared.punchOut(lat: lat, lng: lng)
            isPunchedIn = false
            successMessage = "Punched Out Successfully!"
            await loadLogs()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func loadLogs() async {
        do {
            let response = try await APIService.shared.getAttendance()
            logs = response.logs
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
