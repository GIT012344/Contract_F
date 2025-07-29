// JWT Token Utility Functions

/**
 * Decode JWT token เพื่อดูข้อมูล payload
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload หรือ null ถ้า token ไม่ถูกต้อง
 */
export function decodeToken(token) {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    // payload.id, payload.username, payload.role, payload.authMethod
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * ตรวจสอบว่า token หมดอายุหรือยัง
 * @param {string} token - JWT token
 * @returns {boolean} - true ถ้า token หมดอายุ
 */
export function isTokenExpired(token) {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * ดึงข้อมูลผู้ใช้จาก token
 * @param {string} token - JWT token
 * @returns {object|null} - User data หรือ null
 */
export function getUserFromToken(token) {
  try {
    const payload = decodeToken(token);
    if (!payload) return null;
    
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
      authMethod: payload.authMethod || 'local'
    };
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
}

/**
 * ตรวจสอบว่าผู้ใช้เข้าสู่ระบบผ่าน LDAP หรือไม่
 * @param {string} token - JWT token
 * @returns {boolean} - true ถ้าเป็น LDAP authentication
 */
export function isLdapAuthenticated(token) {
  try {
    const payload = decodeToken(token);
    return payload?.authMethod === 'ldap';
  } catch (error) {
    return false;
  }
}

/**
 * ดึงข้อความแสดงวิธีการเข้าสู่ระบบ
 * @param {string} authMethod - 'ldap' หรือ 'local'
 * @returns {string} - ข้อความแสดงวิธีการเข้าสู่ระบบ
 */
export function getAuthMethodDisplay(authMethod) {
  switch (authMethod) {
    case 'ldap':
      return 'LDAP Authentication';
    case 'local':
      return 'Local Account';
    default:
      return 'Unknown';
  }
}

/**
 * ดึง badge สำหรับแสดงวิธีการเข้าสู่ระบบ
 * @param {string} authMethod - 'ldap' หรือ 'local'
 * @returns {object} - { icon, text, className }
 */
export function getAuthMethodBadge(authMethod) {
  switch (authMethod) {
    case 'ldap':
      return {
        icon: '🔐',
        text: 'LDAP',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    case 'local':
      return {
        icon: '👤',
        text: 'Local',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    default:
      return {
        icon: '❓',
        text: 'Unknown',
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      };
  }
}
