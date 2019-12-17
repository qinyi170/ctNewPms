const app = getApp()
var utils = require("../../utils/util.js");
Page({
  data: {
    allDataList: [],
    morestate: "1",
    scrollheight: "height:" + (app.globalData.pheight - 5-10) + "px"
  },
  onShow: function () {
    this.refreshNewData();
  },
  //加载数据
  refreshNewData: function () {
    utils.showLoading();
    var athis = this;
    var fundatas = {};
    if (athis.data.morestate == "1") {
      athis.setData({
        allDataList: []
      });
      fundatas = {
        "skey": app.globalData.skey,
        "startSize": "0"
      }
    } else {
      fundatas = {
        "skey": app.globalData.skey,
        "startSize": athis.data.allDataList.length
      }
    }
    utils.request("/order/queryOrderMsgList", fundatas, function (e) {
      console.log(e)
      if (e.data.result == "0") {
        wx.hideLoading();
        if (athis.data.morestate == "1") {
          athis.setData({
            allDataList: e.data.dataObject
          })
        } else {
          if (e.data.dataObject == "" || e.data.dataObject == null) {
            wx.showToast({
              title: "没有更多数据",
              icon: "none",
            });
            return;
          }
          athis.setData({
            allDataList: athis.data.allDataList.concat(e.data.dataObject)
          })
        }
      } else {
        utils.alertViewNosucces("提示", e.data.message + " ", false);
      }
    })
  },
  //加载更多操作
  loadMoreData: function () {
    this.setData({
      morestate: "2"
    })
    this.refreshNewData();
  },
})