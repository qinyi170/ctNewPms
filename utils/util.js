const app = getApp();
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/*
  网络请求
  parameters为传递的参数，
  若为get请求时，parameters的格式为key1=value1&key2=value2，
  若为post请求时，parameters的格式为{key1:value1,key2:value2}
*/
function request(url = "", parameters = "", success, method = "POST", header = {}) {
  var urls;
  var datas = {};
  if (method == "GET") {
    urls = app.globalData.urls + url + "?" + parameters;
  } else if (method == "POST") {
    urls = app.globalData.urls + url;
    datas = parameters
  }
  wx.request({
    url: urls,
    data: datas,
    method: method, // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      success(res);
    },
    fail: function (res) {
      console.log(res)
      // fail
    },
    complete: function () {
      // complete
    }
  })
}

//成功提示
function showSuccess(title = "成功啦", duration = 2500) {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: (duration <= 0) ? 2500 : duration
  });
}
//loading提示
function showLoading(title = "请稍后", duration = 5000) {
  wx.showLoading({
    title: title,
    mask: true
  })
}
//隐藏提示框
function hideToast() {
  wx.hideToast();
}

//显示带取消按钮的消息提示框
function alertViewWithCancel(title = "提示", content = "消息提示", confirm, showCancel = "true") {
  wx.showModal({
    title: title,
    content: content,
    showCancel: showCancel,
    success: function (res) {
      if (res.confirm) {
        confirm();
      }
    }
  });
}
//显示不取消按钮的消息提示框
function alertView(title = "提示", content = "消息提示", confirm) {
  alertViewWithCancel(title, content, confirm, false);
}
//显示不带取消按钮和事件的消息提示框
function alertViewNosucces(title = "提示", content = "消息提示", showCancel = "false") {
  wx.showModal({
    title: title,
    content: content,
    showCancel: showCancel
  });
}




/**
  *
  * json转字符串
  */
function stringToJson(data) {
  return JSON.parse(data);
}
/**
*字符串转json
*/
function jsonToString(data) {
  return JSON.stringify(data);
}
/**
*map转换为json
*/
function mapToJson(map) {
  return JSON.stringify(strMapToObj(map));
}
/**
*json转换为map
*/
function jsonToMap(jsonStr) {
  return objToStrMap(JSON.parse(jsonStr));
}


/**
*map转化为对象（map所有键都是字符串，可以将其转换为对象）
*/
function strMapToObj(strMap) {
  let obj = Object.create(null);
  for (let [k, v] of strMap) {
    obj[k] = v;
  }
  return obj;
}

/**
*对象转换为Map
*/
function objToStrMap(obj) {
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}
//捕捉没有result的错误返回
function backcode1(title, content) {
  alertViewWithCancel(title, content, function () {
    if (app.globalData.minroute == "") {
      if (app.globalData.userState == null || app.globalData.userState == "" || app.globalData.userState == "logout") {
        wx.reLaunch({
          url: '../../pages/index/index'
        })
      } else if (app.globalData.userState == "thirdEleOk") {
        wx.reLaunch({
          url: '../../pages/qrcode/qrcode'
        })
      }
    } else {
      if (app.globalData.scene == "1037") {
        wx.navigateBackMiniProgram()
      }
      if (app.globalData.scene == "1069") {
        var jsonstr = {
          "result_detail": "9999999"
        }
        app.globalData.backappandiosmsg = JSON.stringify(jsonstr)
        wx.reLaunch({
          url: '../../pages/route/backappandios'
        })
      }
    }
  }, false);
}
function backcode2(title, content) {
  alertViewWithCancel(title, content, function () {
    wx.reLaunch({
      url: '../../pages/qrcode/qrcode'
    })
  }, false);
}
function MathRand() {
  var Num = "";
  for (var i = 0; i < 6; i++) {
    Num += Math.floor(Math.random() * 10);
  }
  return Num;
}


module.exports = {
  MathRand: MathRand,
  backcode1: backcode1,
  backcode2: backcode2,
  stringToJson: stringToJson,
  jsonToString: jsonToString,
  mapToJson: mapToJson,
  jsonToMap: jsonToMap,
  strMapToObj: strMapToObj,
  objToStrMap: objToStrMap,
  formatTime: formatTime,
  request: request,
  showSuccess: showSuccess,
  showLoading: showLoading,
  hideToast: hideToast,
  alertViewWithCancel: alertViewWithCancel,
  alertView: alertView,
  alertViewNosucces: alertViewNosucces
}