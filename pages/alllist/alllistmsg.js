const app = getApp();
var utils = require("../../utils/util.js");
Page({
  data:{
    roomInfo:{}
  },
  onLoad:function(e){
    this.activemsg(e.oauthcode);
  },
  activemsg: function (oauthcode){
    var athis=this;
    utils.showLoading("请稍等");
    utils.request("/order/showOrderDetail", {
      "oauth_code": oauthcode,
      "skey": app.globalData.skey
    }, function (res1) {
      console.log(res1)
      wx.hideLoading();
      if (res1.data.result == "0") {
        athis.setData({
          reside_date: res1.data.dataObject.roomInfo.reside_date.substring(0, 10),
          reside_retreat_date: res1.data.dataObject.roomInfo.reside_retreat_date.substring(0, 10),
          reside_date_time: res1.data.dataObject.roomInfo.reside_date.substring(11, 17),
          reside_retreat_date_time: res1.data.dataObject.roomInfo.reside_retreat_date.substring(11, 17),
          roomInfo: res1.data.dataObject.roomInfo,
        })
      } else {
        if (!res1.data.result) {
          utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
          return;
        }
        utils.alertViewNosucces("提示", res1.data.message + "", false);
      }
    })
  }
})