export const loginValidation = (email, password) => {
  if (!email || !password) {
    return "Email and password are required";
  }
  if (!email.includes("@")) {
    return "Invalid email";
  }
  return null;
};