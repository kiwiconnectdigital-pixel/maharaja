// "Aman Rajpoot" -> "aman@123"
function generateDefaultPassword(fullName) {
  if (!fullName || !fullName.trim()) return `user@123`;
  const firstName = fullName.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${firstName || "user"}@123`;
}

module.exports = { generateDefaultPassword };
