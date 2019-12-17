const app = getApp();
var utils = require("../../utils/util.js");
var timers;
Page({
  data: {
    loadingstate: 1,
    buttontype: 1,
    scrollheight: "height:" + app.globalData.pheight + "px"
  },
  onShow: function () {
    this.checkloging();
  },
  onHide: function () {
    clearTimeout(timers);
  },
  onUnload: function () {
    clearTimeout(timers);
  },
  // 登录
  checkloging: function () {
    var athis = this;
    utils.showLoading("请稍等")
    timers = setTimeout(function () {
      wx.hideLoading()
      if (athis.data.loadingstate == 1) {
        utils.alertView("提示", "请求失败，请点击“确定”重新请求", function () {
          athis.checkloging();
        })
      }
    }, 10000)
    wx.login({
      success: res => {
        utils.request("/order/onLogin", {
          code: res.code
        }, function (e) {
          if (e.data.result == "0") {
            clearTimeout(timers);
            app.globalData.skey = e.data.dataObject.skey;
            utils.request("/order/isRegister", {
              "skey": app.globalData.skey
            }, function (e) {
              wx.hideLoading();
              if (e.data.result == "0") {
                if (e.data.errorCode == "0001") {
                  wx.switchTab({
                    url: '../../pages/list/list',
                  })
                } else {
                  athis.setData({
                    buttontype: 2
                  });
                }
              } else if (e.data.result == "2") {
                utils.alertView("提示", "你已退出，请点击“确认”重新登录", function () {
                  app.getLogin();
                })
              } else {
                if (!e.data.result) {
                  utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
                  return;
                }
                utils.alertViewNosucces("提示", e.data.message + "", false);
              }
            })
          } else {
            wx.hideLoading();
            if (!e.data.result) {
              utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
              return;
            }
            utils.alertViewNosucces("提示", e.data.message + "", false);
          }
        })
      }
    })
  },
  //获取微信手机号回调事件
  getPhoneNumber: function (e) {
    var athis = this;
    athis.setData({
      currentTopItem: "2"
    })
    setTimeout(function () {
      athis.setData({
        currentTopItem: "1"
      })
    }, 1000)
    if (e.detail.errMsg == 'getPhoneNumber:user deny' || e.detail.errMsg == 'getPhoneNumber:fail:cancel to confirm login') {
      console.log(1)
    } else {
      utils.showLoading("请稍等");
      utils.request("/order/getuserphone", {
        "encryptedData": e.detail.encryptedData,
        "iv": e.detail.iv,
        "skey": app.globalData.skey
      }, function (respass) {
        wx.hideLoading();
        if (respass.data.result == "0") {
          app.globalData.phoneNumber = respass.data.dataObject.phoneNumber;
          wx.switchTab({
            url: '../../pages/list/list',
          })
        } else if (respass.data.result == "2") {
          utils.alertView("提示", "你已退出，请点击“确认”重新登录", function () {
            app.getLogin();
          })
        } else {
          utils.alertViewNosucces("提示", respass.data.message + "", false);
        }
      })
    }
  },
  getrefech: function () {
    this.checkloging();
  }
})