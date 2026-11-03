function createAuthController(authService) {
  const assignableRoles = new Set(["user", "admin"]);

  return {
    async listUsers(request, response, next) {
      try {
        return response.json(await authService.listUsers());
      } catch (error) {
        return next(error);
      }
    },

    async register(request, response, next) {
      const body = request.body || {};
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (username.length < 2 || username.length > 120) {
        return response.status(400).json({ message: "Name must be between 2 and 120 characters." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
        return response.status(400).json({ message: "Enter a valid email address." });
      }
      if (phone.length < 6 || phone.length > 32) {
        return response.status(400).json({ message: "Enter a valid phone number." });
      }
      if (password.length < 8 || password.length > 72) {
        return response.status(400).json({ message: "Password must be between 8 and 72 characters." });
      }

      try {
        const user = await authService.register({ username, email, phone, password, role: "customer" });
        return response.status(201).json({ message: "Registration successful.", user });
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return response.status(409).json({ message: "An account with this email or phone already exists." });
        }
        return next(error);
      }
    },

    async createUser(request, response, next) {
      const body = request.body || {};
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const role = typeof body.role === "string" ? body.role.toLowerCase() : "";

      if (username.length < 2 || username.length > 120) {
        return response.status(400).json({ message: "Username must be between 2 and 120 characters." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
        return response.status(400).json({ message: "Enter a valid email address." });
      }
      if (phone && (phone.length < 6 || phone.length > 32)) {
        return response.status(400).json({ message: "Phone number must be between 6 and 32 characters." });
      }
      if (password.length < 8 || password.length > 72) {
        return response.status(400).json({ message: "Password must be between 8 and 72 characters." });
      }
      if (!assignableRoles.has(role)) {
        return response.status(400).json({ message: "Choose a valid user role." });
      }

      try {
        const user = await authService.register({ username, email, phone: phone || null, password, role });
        return response.status(201).json({ message: "User created successfully.", user });
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return response.status(409).json({ message: "An account with this email or phone already exists." });
        }
        return next(error);
      }
    },

    async updateUser(request, response, next) {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid user ID." });
      }

      const body = request.body || {};
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const role = typeof body.role === "string" ? body.role.toLowerCase() : "";

      if (username.length < 2 || username.length > 120) {
        return response.status(400).json({ message: "Username must be between 2 and 120 characters." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
        return response.status(400).json({ message: "Enter a valid email address." });
      }
      if (phone && (phone.length < 6 || phone.length > 32)) {
        return response.status(400).json({ message: "Phone number must be between 6 and 32 characters." });
      }
      if (!assignableRoles.has(role)) {
        return response.status(400).json({ message: "Choose a valid user role." });
      }

      try {
        const user = await authService.updateUser(id, { username, email, phone: phone || null, role });
        if (!user) return response.status(404).json({ message: "User not found." });
        return response.json({ message: "User updated successfully.", user });
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return response.status(409).json({ message: "An account with this email or phone already exists." });
        }
        return next(error);
      }
    },

    async deleteUser(request, response, next) {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid user ID." });
      }
      if (Number(request.user?.id) === id) {
        return response.status(400).json({ message: "You cannot delete your own admin account." });
      }

      try {
        const deleted = await authService.deleteUser(id);
        if (!deleted) return response.status(404).json({ message: "User not found." });
        return response.status(204).end();
      } catch (error) {
        return next(error);
      }
    },

    async login(request, response, next) {
      const body = request.body || {};
      const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!identifier || !password) {
        return response.status(400).json({ message: "Email/mobile number and password are required." });
      }

      try {
        const result = await authService.login(identifier, password);
        if (!result) {
          return response.status(401).json({ message: "Invalid email/mobile number or password." });
        }
        if (result.inactive) {
          return response.status(403).json({ message: "This account is inactive. Contact support for assistance." });
        }
        return response.json(result);
      } catch (error) {
        return next(error);
      }
    },

    async googleLogin(request, response, next) {
      const credential = typeof request.body?.credential === "string" ? request.body.credential : "";
      if (!credential) {
        return response.status(400).json({ message: "Google credential is required." });
      }

      try {
        return response.json(await authService.googleLogin(credential));
      } catch (error) {
        if (error.status === 401 && error.cause) {
          console.error("Google credential verification failed:", error.cause.message);
        }
        if (error.status) {
          return response.status(error.status).json({ message: error.message });
        }
        return next(error);
      }
    },
    async updateProfile(request, response, next) {
      const userId = request.user?.user_id;
      if (!userId) return response.status(401).json({ message: "Authentication required." });

      const body = request.body || {};
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const phone    = typeof body.phone    === "string" ? body.phone.trim()    : "";
      const dob      = typeof body.dob      === "string" ? body.dob.trim()      : null;
      const gender   = typeof body.gender   === "string" ? body.gender.trim()   : null;

      if (username.length < 2 || username.length > 120) {
        return response.status(400).json({ message: "Name must be between 2 and 120 characters." });
      }

      try {
        const [rows] = await request.pool.execute(
          "SELECT id FROM users WHERE user_id = ?", [userId]
        );
        if (!rows.length) return response.status(404).json({ message: "User not found." });
        const numericId = rows[0].id;
        await request.pool.execute(
          "UPDATE users SET username = ?, phone = ?, dob = ?, gender = ? WHERE id = ?",
          [username, phone || null, dob || null, gender || null, numericId]
        );
        const [updated] = await request.pool.execute(
          "SELECT id, user_id, username, email, phone, dob, gender, role, status, created_at, updated_at FROM users WHERE id = ?",
          [numericId]
        );
        const u = updated[0];
        return response.json({
          message: "Profile updated successfully.",
          user: { id: u.id, user_id: u.user_id, username: u.username, name: u.username, email: u.email, phone: u.phone, dob: u.dob, gender: u.gender, role: u.role, status: u.status }
        });
      } catch (error) {
        return next(error);
      }
    },

    async changePassword(request, response, next) {
      const userId = request.user?.user_id;
      if (!userId) return response.status(401).json({ message: "Authentication required." });

      const body = request.body || {};
      const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
      const newPassword     = typeof body.newPassword     === "string" ? body.newPassword     : "";

      if (!currentPassword) return response.status(400).json({ message: "Current password is required." });
      if (newPassword.length < 8 || newPassword.length > 72) {
        return response.status(400).json({ message: "New password must be between 8 and 72 characters." });
      }

      try {
        const bcrypt = require("bcryptjs");
        const [rows] = await request.pool.execute(
          "SELECT id, password_hash FROM users WHERE user_id = ?", [userId]
        );
        if (!rows.length) return response.status(404).json({ message: "User not found." });
        const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!match) return response.status(400).json({ message: "Current password is incorrect." });
        const hash = await bcrypt.hash(newPassword, 12);
        await request.pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, rows[0].id]);
        return response.json({ message: "Password changed successfully." });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createAuthController };
