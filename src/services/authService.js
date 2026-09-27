const USERS_KEY = 'portal_users';
const CURRENT_USER_KEY = 'portal_current_user';

export const authService = {
  getUsers: () => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveUsers: (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getCurrentUser: () => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  registerCitizen: (userData) => {
    const users = authService.getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    
    if (users.find(u => u.email.trim().toLowerCase() === cleanEmail)) {
      throw new Error("Email already registered.");
    }
    
    const newUser = {
      ...userData,
      email: userData.email.trim(), // Save trimmed original case
      id: `USR-${Date.now()}`,
      role: 'citizen',
      joinDate: new Date().toISOString()
    };
    
    users.push(newUser);
    authService.saveUsers(users);
    authService.setCurrentUser(newUser);
    return newUser;
  },

  signInCitizen: (email, password) => {
    const users = authService.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.trim().toLowerCase() === cleanEmail && u.role === 'citizen');
    
    if (!user) {
      throw new Error("Incorrect email or password.");
    }
    if (user.password !== password) {
      throw new Error("Incorrect email or password.");
    }
    
    authService.setCurrentUser(user);
    return user;
  },

  signInHandler: (email, otp) => {
    // Mock OTP flow for frontend prototype
    if (otp !== "123456") {
      throw new Error("Invalid OTP. Please try again.");
    }
    // Hardcoded handler for demo
    const handler = {
      id: 'HND-001',
      name: 'Operations Team',
      email: email,
      role: 'handler'
    };
    authService.setCurrentUser(handler);
    return handler;
  },

  signOut: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};
