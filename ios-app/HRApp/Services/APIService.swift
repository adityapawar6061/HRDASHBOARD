import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case unauthorized
    case serverError(String)
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .unauthorized: return "Unauthorized. Please login again."
        case .serverError(let msg): return msg
        case .decodingError: return "Failed to parse response"
        }
    }
}

class APIService {
    static let shared = APIService()
    private let baseURL = Bundle.main.object(forInfoDictionaryKey: "BASE_URL") as? String ?? "http://localhost:5000/api"

    private var token: String? {
        get { UserDefaults.standard.string(forKey: "token") }
    }

    private func makeRequest(_ path: String, method: String = "GET", body: Encodable? = nil) throws -> URLRequest {
        guard let url = URL(string: "\(baseURL)/\(path)") else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body { req.httpBody = try JSONEncoder().encode(body) }
        return req
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.serverError("No response") }
        if http.statusCode == 401 { throw APIError.unauthorized }
        if !(200...299).contains(http.statusCode) {
            let errBody = try? JSONDecoder().decode(Models.APIError.self, from: data)
            throw APIError.serverError(errBody?.error ?? "HTTP \(http.statusCode)")
        }
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw APIError.decodingError }
    }

    func login(email: String, password: String) async throws -> LoginResponse {
        let req = try makeRequest("auth/login", method: "POST", body: LoginRequest(email: email, password: password))
        return try await perform(req)
    }

    func punchIn(lat: Double, lng: Double, deviceInfo: DeviceInfo) async throws -> AttendanceLog {
        let req = try makeRequest("attendance/punch-in", method: "POST", body: PunchRequest(latitude: lat, longitude: lng, device_info: deviceInfo))
        return try await perform(req)
    }

    func punchOut(lat: Double, lng: Double) async throws -> AttendanceLog {
        let req = try makeRequest("attendance/punch-out", method: "POST", body: PunchRequest(latitude: lat, longitude: lng, device_info: nil))
        return try await perform(req)
    }

    func getAttendance() async throws -> AttendanceResponse {
        let req = try makeRequest("attendance?page=1&limit=20")
        return try await perform(req)
    }
}

// Namespace to avoid conflict with local APIError enum
enum Models {
    struct APIError: Codable { let error: String }
}
