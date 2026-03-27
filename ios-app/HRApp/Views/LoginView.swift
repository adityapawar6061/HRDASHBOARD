import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(hex: "4F46E5"), Color(hex: "3730A3")],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                VStack(spacing: 6) {
                    Text("HR Dashboard").font(.largeTitle).bold().foregroundColor(.white)
                    Text("Employee Login").foregroundColor(.white.opacity(0.8))
                }
                .padding(.bottom, 20)

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(10)

                    SecureField("Password", text: $password)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(10)
                }

                if !authVM.errorMessage.isEmpty {
                    Text(authVM.errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .padding(.horizontal)
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(8)
                }

                Button(action: {
                    Task { await authVM.login(email: email, password: password) }
                }) {
                    if authVM.isLoading {
                        ProgressView().tint(Color(hex: "4F46E5"))
                    } else {
                        Text("Sign In").bold().foregroundColor(Color(hex: "4F46E5"))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.white)
                .cornerRadius(10)
                .disabled(authVM.isLoading)
            }
            .padding(32)
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
