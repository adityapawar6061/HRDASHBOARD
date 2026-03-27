import Foundation
import SwiftUI

@MainActor
class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoggedIn = false
    @Published var isLoading = false
    @Published var errorMessage = ""

    init() {
        if let token = UserDefaults.standard.string(forKey: "token"),
           let data = UserDefaults.standard.data(forKey: "user"),
           let savedUser = try? JSONDecoder().decode(User.self, from: data) {
            self.user = savedUser
            self.isLoggedIn = !token.isEmpty
        }
    }

    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = ""
        do {
            let response = try await APIService.shared.login(email: email, password: password)
            UserDefaults.standard.set(response.token, forKey: "token")
            if let data = try? JSONEncoder().encode(response.user) {
                UserDefaults.standard.set(data, forKey: "user")
            }
            user = response.user
            isLoggedIn = true
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func logout() {
        UserDefaults.standard.removeObject(forKey: "token")
        UserDefaults.standard.removeObject(forKey: "user")
        user = nil
        isLoggedIn = false
    }
}
