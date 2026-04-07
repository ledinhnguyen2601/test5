import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. TỰ ĐỘNG KÉO DANH SÁCH KHU TRỌ/CHUNG CƯ
  // ==========================================
  const regBuildingSelect = document.getElementById("reg-building");
  if (regBuildingSelect) {
    getDocs(collection(db, "building_profiles"))
      .then((snap) => {
        if (!snap.empty) {
          regBuildingSelect.innerHTML =
            '<option value="">-- Chọn Khu trọ / Chung cư --</option>';
          snap.forEach((docSnap) => {
            const buildingData = docSnap.data();
            // docSnap.id chính là mã vùng
            regBuildingSelect.innerHTML += `<option value="${docSnap.id}">${buildingData.name}</option>`;
          });
        } else {
          regBuildingSelect.innerHTML =
            '<option value="">-- Hệ thống chưa có khu vực nào --</option>';
        }
      })
      .catch((err) => console.log("Lỗi tải danh sách:", err));
  }

  // ==========================================
  // 2. XỬ LÝ ĐĂNG NHẬP & ĐIỀU HƯỚNG THÔNG MINH
  // ==========================================
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-pass").value;
      const btn = loginForm.querySelector("button");
      btn.innerText = "Đang xác thực...";

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          pass,
        );
        const user = userCredential.user;

        // Kéo thông tin user từ Database
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();

          // Chặn nếu chưa được duyệt
          if (data.status === "pending") {
            alert("Tài khoản của bạn đang chờ Admin phê duyệt!");
            auth.signOut();
            btn.innerText = "Đăng nhập";
            return;
          }

          // ĐIỀU HƯỚNG DỰA VÀO QUYỀN (ROLE)
          if (data.role === "super_admin") {
            window.location.href = "super-admin.html";
          } else if (data.role === "admin_motel") {
            window.location.href = "admin-motel.html";
          } else if (data.role === "admin_apartment") {
            window.location.href = "admin-apartment.html";
          } else {
            // NẾU LÀ KHÁCH: Hệ thống tự check xem tòa nhà đó là Trọ hay Chung cư để chuyển đúng trang
            const buildingDoc = await getDoc(
              doc(db, "building_profiles", data.building),
            );
            if (
              buildingDoc.exists() &&
              buildingDoc.data().type === "apartment"
            ) {
              window.location.href = "tenant-apartment.html";
            } else {
              window.location.href = "tenant-motel.html"; // Mặc định về xóm trọ
            }
          }
        } else {
          alert("Không tìm thấy dữ liệu người dùng trên hệ thống!");
          btn.innerText = "Đăng nhập";
        }
      } catch (error) {
        alert("Sai Email hoặc Mật khẩu!");
        btn.innerText = "Đăng nhập";
        console.error(error);
      }
    });
  }

  // ==========================================
  // 3. XỬ LÝ ĐĂNG KÝ TÀI KHOẢN
  // ==========================================
  const regForm = document.getElementById("register-form");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value;
      const email = document.getElementById("reg-email").value;
      const phone = document.getElementById("reg-phone").value;
      const building = document.getElementById("reg-building").value;
      const room = document.getElementById("reg-room").value;
      const pass = document.getElementById("reg-pass").value;

      if (!building) return alert("Vui lòng chọn Khu vực muốn đăng ký!");

      const btn = regForm.querySelector("button");
      btn.innerText = "Đang xử lý đăng ký...";

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          pass,
        );
        const user = userCredential.user;

        // Ghi vào Database (Mặc định là Khách thuê và Chờ duyệt)
        await setDoc(doc(db, "users", user.uid), {
          name: name,
          email: email,
          phone: phone,
          building: building,
          room: room,
          role: "tenant",
          status: "pending",
        });

        alert(
          "Đăng ký thành công! Vui lòng chờ Chủ Trọ / BQL phê duyệt để đăng nhập.",
        );
        // Reset form và chuyển về tab đăng nhập (nếu cần)
        window.location.reload();
      } catch (error) {
        alert(
          "Lỗi: Email này có thể đã được đăng ký hoặc mật khẩu quá ngắn (dưới 6 ký tự).",
        );
        btn.innerText = "Đăng ký";
        console.error(error);
      }
    });
  }
});
