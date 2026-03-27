import Foundation

struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct User: Codable {
    let id: String
    let name: String
    let email: String
    let role: String
}

struct LoginResponse: Codable {
    let token: String
    let user: User
}

struct DeviceInfo: Codable {
    let deviceName: String
    let os: String
    let deviceId: String
}

struct PunchRequest: Codable {
    let latitude: Double
    let longitude: Double
    let device_info: DeviceInfo?
}

struct AttendanceLog: Codable, Identifiable {
    let id: String
    let user_id: String
    let punch_in_time: String
    let punch_out_time: String?
    let punch_in_lat: Double?
    let punch_in_lng: Double?
    let punch_out_lat: Double?
    let punch_out_lng: Double?
}

struct AttendanceResponse: Codable {
    let logs: [AttendanceLog]
    let total: Int
    let page: Int
}

struct APIError: Codable {
    let error: String
}
