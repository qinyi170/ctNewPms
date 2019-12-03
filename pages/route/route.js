const app = getApp();
var utils = require("../../utils/util.js");
Page({
  data:{
    phones:"",
    order_id:"",
    phonestate:"1",
    buttontype: "1",
    scrollheight: "height:" + app.globalData.pheight + "px"
  },
  onLoad: function (options) {
    console.log(options)
    var athis = this;
    var str = decodeURIComponent(options.scene);
    console.log(str)
    athis.setData({
      newstr: str.substring(str.lastIndexOf("=") + 1).substring(0)
    })  
    utils.showLoading("请稍等");
    wx.login({
      success: res => {
        utils.request("/order/onLogin",{
          code: res.code
        }, function (e) {
          console.log("onLogin",e)
          if (e.data.result == "0") {
            app.globalData.skey = e.data.dataObject.skey;
            utils.request("/order/isRegister", {
              "skey": app.globalData.skey
            }, function (e) {
              console.log("isRegister", e)
              if (e.data.result == "0") {
                if (e.data.errorCode == "0001") {
                  athis.isOwnerOrder();
                } else {
                  wx.hideLoading();
                  athis.setData({
                    buttontype: "2"
                  });
                }
              } else if (e.data.result == "2") {
                wx.hideLoading();
                utils.alertView("提示", "你已退出，请点击“确认”重新登录", function () {
                  app.getLogin();
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
  //断是否需要验证预留手机号
  isOwnerOrder:function(){
    var athis=this;
    utils.request("/order/isOwnerOrder", {
      skey: app.globalData.skey,
      order_id: athis.data.newstr
    }, function (e) {
      console.log("isOwnerOrder", e);
      wx.hideLoading();
      if (e.data.result == "0") {
        if (e.data.errorCode == "0000") {
          athis.setData({
            order_id: e.data.dataObject.order_id,
            phonestate: "2",
            buttontype:"1"
          })
        } else {
          wx.switchTab({
            url: '../../pages/list/list',
          })
        }
      } else {
        if (!e.data.result) {
          utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
          return;
        }
        utils.alertViewNosucces("提示", e.data.message + "", false);
      }
    })
  },

  writephone:function(e){
    console.log(e.detail.value)
    this.setData({
      phones: e.detail.value
    })
  },
  bindphone:function(){
    var athis = this;
    utils.showLoading("请稍等");
    utils.request("/order/verifyOrderPhone", {
      "reside_phone": athis.data.phones,
      "order_id": athis.data.order_id,
      "skey": app.globalData.skey
    }, function (res1) {
      console.log(res1)
      wx.hideLoading();
      if (res1.data.result == "0") {
        if (res1.data.errorCode == "0000") {
          wx.switchTab({
            url: '../../pages/list/list',
          })
        }else{
          utils.alertViewNosucces("提示", res1.data.message + "", false);
        }
      } else {
        if (!res1.data.result) {
          utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
          return;
        }
        utils.alertViewNosucces("提示", res1.data.message + "", false);
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
        if (respass.data.result == "0") {
          app.globalData.phoneNumber = respass.data.dataObject.phoneNumber;
          athis.isOwnerOrder();
        } else if (respass.data.result == "2") {
          wx.hideLoading();
          utils.alertView("提示", "你已退出，请点击“确认”重新登录", function () {
            app.getLogin();
          })
        } else {
          wx.hideLoading();
          utils.alertViewNosucces("提示", respass.data.message + "", false);
        }
      })
    }
  }
})