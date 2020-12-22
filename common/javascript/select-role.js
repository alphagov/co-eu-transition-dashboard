const selectRoleOnChange = () =>  {
  const PERMISSIONS = 'permissions'
  const role = document.getElementById("selectRoleId").value;
  const url = window.location.href;
  const indexOfPermissions = url.indexOf(PERMISSIONS)
  const firstSubstrLength = (url.indexOf(`${PERMISSIONS}/`) > -1) ? indexOfPermissions + PERMISSIONS.length +1 : indexOfPermissions + PERMISSIONS.length;
  let lastSubstr = `/${role}`
  if (url.indexOf(`${PERMISSIONS}/`) > 0) {
    lastSubstr = url.indexOf("/", firstSubstrLength) > -1 ?  `${role}${url.substring(url.indexOf("/", firstSubstrLength))}` : role
  }
  const newUrl = `${url.substring(0,firstSubstrLength)}${lastSubstr}`;
  window.location.href = newUrl;
}

export { selectRoleOnChange }
