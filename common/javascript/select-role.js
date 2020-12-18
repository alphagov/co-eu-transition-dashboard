export default () =>  {
    const role = document.getElementById("selectRoleId").value;
    const url = window.location.href;
    const firstSubstrLength = (url.indexOf('permissions/') > -1) ? url.indexOf('permissions')+'permissions'.length +1 : url.indexOf('permissions')+'permissions'.length;
    let lastSubstr = `/${role}`
    if (url.indexOf('permissions/') > 0) {
        lastSubstr = url.indexOf("/", firstSubstrLength) > -1 ?  `${role}${url.substring(url.indexOf("/", firstSubstrLength))}` : role
    }
    const newUrl = `${url.substring(0,firstSubstrLength)}${lastSubstr}`;
    window.location.href = newUrl;
}