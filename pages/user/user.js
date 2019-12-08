const app = getApp()
var utils = require("../../utils/util.js");
Page({
  data:{
    notices:1,
    noticestype:1
  },
  onShow:function(){
    this.noticeactive();
    this.showPhone();
  },
  noticeactive:function(){
    var athis = this;
    utils.showLoading("请稍等");
    utils.request("/order/queryOrderMsg", {
      "skey": app.globalData.skey
    }, function (res1) {
      console.log(res1)
      wx.hideLoading();
      if (res1.data.result == "0") {
        if (res1.data.dataObject==0){
          athis.setData({
            notices: res1.data.dataObject,
            noticestype: 1
          })
        }else{
          athis.setData({
            notices: res1.data.dataObject,
            noticestype: 2
          })         
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
  showPhone: function () {
    var athis = this;
    utils.showLoading("请稍等");
    utils.request("/order/showPhone", {
      "skey": app.globalData.skey
    }, function (res1) {
      console.log(res1)
      wx.hideLoading();
      if (res1.data.result == "0") {
        athis.setData({
          user_phone: res1.data.dataObject.user_phone
        })
      } else {
        if (!res1.data.result) {
          utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
          return;
        }
        utils.alertViewNosucces("提示", res1.data.message + "", false);
      }
    })
  },
  phonecallevent: function () {
    wx.makePhoneCall({
      phoneNumber: "01058815600"
    })
  },
  getnotice:function(){
    wx.navigateTo({
      url: "../user/roomnotice"
    })
  },
  onShareAppMessage: function (ops) {
    if (ops.from === 'button') {
      console.log(ops.target)
    }
    return {
      title: '网约房实名入住',
      path: 'pages/welcome/welcome',
      success: function (res) {
        console.log("转发成功:" + JSON.stringify(res));
      },
      fail: function (res) {
        console.log("转发失败:" + JSON.stringify(res));
      }
    }
  }
})