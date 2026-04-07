import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // ĐĂNG KÝ
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;
      const building = document.getElementById("reg-building").value; // 'hoasen' hoặc 'binhdan'
      const room = document.getElementById("reg-room").value;
      const name = document.getElementById("reg-name").value;
      const btn = document.getElementById("btnRegSubmit");

      try {
        btn.innerText = "Đang xử lý...";
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          name: name,
          building: building,
          room: room,
          role: "tenant",
          status: "pending",
        });
        await signOut(auth);
        alert("Đăng ký thành công! Vui lòng chờ BQL/Chủ trọ phê duyệt.");
        document.getElementById("form-register").style.display = "none";
        document.getElementById("form-login").style.display = "block";
        btn.innerText = "Gửi Đăng Ký (Cần duyệt)";
      } catch (error) {
        alert("Lỗi đăng ký: " + error.message);
        btn.innerText = "Gửi Đăng Ký (Cần duyệt)";
      }
    });
  }

  // ĐĂNG NHẬP ĐIỀU HƯỚNG
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const btn = document.getElementById("btnLoginSubmit");

      try {
        btn.innerText = "Đang kiểm tra...";
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();

          if (data.status === "pending") {
            await signOut(auth);
            alert("Tài khoản CHƯA ĐƯỢC DUYỆT. Vui lòng liên hệ BQL.");
            btn.innerText = "Đăng nhập";
            return;
          }

          // ĐIỀU HƯỚNG
          if (data.role === "super_admin") {
            window.location.href = "super-admin.html";
          } else if (data.role === "admin_motel") {
            window.location.href = "admin-motel.html";
          } else if (data.role === "admin_apartment") {
            window.location.href = "admin-apartment.html";
          } else {
            // Mặc định role là tenant
            if (data.building === "hoasen") {
              window.location.href = "tenant-apartment.html";
            } else {
              window.location.href = "tenant-motel.html";
            }
          }
        } else {
          alert("Lỗi: Không tìm thấy dữ liệu quyền hạn!");
          btn.innerText = "Đăng nhập";
        }
      } catch (error) {
        alert("Sai tài khoản email hoặc mật khẩu!");
        btn.innerText = "Đăng nhập";
      }
    });
  }

  // ĐĂNG XUẤT
  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.href = "index.html";
      });
    });
  });
});
