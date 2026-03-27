import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var attendanceVM = AttendanceViewModel()
    @StateObject private var locationManager = LocationManager()

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                VStack(spacing: 4) {
                    Text("Hello, \(authVM.user?.name ?? "Employee")")
                        .font(.title2).bold().foregroundColor(.white)
                    Text(authVM.user?.email ?? "").font(.caption).foregroundColor(.white.opacity(0.8))
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(hex: "4F46E5"))

                ScrollView {
                    VStack(spacing: 20) {
                        // Punch Button
                        VStack(spacing: 12) {
                            Button(action: handlePunch) {
                                ZStack {
                                    Circle()
                                        .fill(attendanceVM.isPunchedIn ? Color.red : Color.green)
                                        .frame(width: 180, height: 180)
                                        .shadow(radius: 10)

                                    if attendanceVM.isLoading {
                                        ProgressView().tint(.white).scaleEffect(2)
                                    } else {
                                        VStack {
                                            Image(systemName: attendanceVM.isPunchedIn ? "stop.circle.fill" : "play.circle.fill")
                                                .font(.system(size: 40))
                                                .foregroundColor(.white)
                                            Text(attendanceVM.isPunchedIn ? "PUNCH OUT" : "PUNCH IN")
                                                .font(.headline).bold().foregroundColor(.white)
                                        }
                                    }
                                }
                            }
                            .disabled(attendanceVM.isLoading)

                            if !attendanceVM.successMessage.isEmpty {
                                Text(attendanceVM.successMessage)
                                    .foregroundColor(.green).font(.subheadline)
                            }
                            if !attendanceVM.errorMessage.isEmpty {
                                Text(attendanceVM.errorMessage)
                                    .foregroundColor(.red).font(.caption).multilineTextAlignment(.center)
                            }
                        }
                        .padding(.top, 24)

                        // Attendance History
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Attendance History")
                                .font(.headline).padding(.horizontal)

                            if attendanceVM.logs.isEmpty {
                                Text("No records found").foregroundColor(.secondary)
                                    .frame(maxWidth: .infinity).padding()
                            } else {
                                ForEach(attendanceVM.logs) { log in
                                    AttendanceRowView(log: log)
                                }
                            }
                        }
                    }
                    .padding(.bottom, 20)
                }
            }
            .navigationBarHidden(true)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Logout") { authVM.logout() }
                }
            }
        }
        .onAppear {
            locationManager.requestPermission()
            Task { await attendanceVM.loadLogs() }
        }
    }

    private func handlePunch() {
        attendanceVM.successMessage = ""
        attendanceVM.errorMessage = ""
        locationManager.fetchLocation()

        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            let lat = locationManager.location?.coordinate.latitude ?? 0.0
            let lng = locationManager.location?.coordinate.longitude ?? 0.0
            Task {
                if attendanceVM.isPunchedIn {
                    await attendanceVM.punchOut(lat: lat, lng: lng)
                } else {
                    await attendanceVM.punchIn(lat: lat, lng: lng)
                }
            }
        }
    }
}

struct AttendanceRowView: View {
    let log: AttendanceLog

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(formatDate(log.punch_in_time)).font(.subheadline).bold()
                Text("In: \(formatTime(log.punch_in_time))").font(.caption).foregroundColor(.secondary)
                if let out = log.punch_out_time {
                    Text("Out: \(formatTime(out))").font(.caption).foregroundColor(.secondary)
                }
            }
            Spacer()
            Text(log.punch_out_time == nil ? "Active" : "Done")
                .font(.caption).bold()
                .foregroundColor(log.punch_out_time == nil ? .orange : .green)
                .padding(.horizontal, 10).padding(.vertical, 4)
                .background((log.punch_out_time == nil ? Color.orange : Color.green).opacity(0.15))
                .cornerRadius(20)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(10)
        .shadow(color: .black.opacity(0.05), radius: 4)
        .padding(.horizontal)
    }

    private func formatDate(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        guard let date = f.date(from: iso) else { return iso }
        let out = DateFormatter(); out.dateStyle = .medium
        return out.string(from: date)
    }

    private func formatTime(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        guard let date = f.date(from: iso) else { return iso }
        let out = DateFormatter(); out.timeStyle = .short
        return out.string(from: date)
    }
}
