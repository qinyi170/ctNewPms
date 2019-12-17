App({
  onLaunch: function (res) {
    var athis = this;
    wx.getSystemInfo({
      success: function (res) {
        console.log(res)
        athis.globalData.pheight = res.windowHeight;//手机屏幕高度
        athis.globalData.pwidth = res.screenWidth;//手机屏幕宽度
      }
    })  
  },
  onShow: function(options){
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      console.log("1" + res.hasUpdate)
    })
    updateManager.onUpdateReady(function (e) {
      console.log(e)
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    updateManager.onUpdateFailed(function () {
      // 新版本下载失败
    })
    if (options.scene == "1038") {
      if (options.referrerInfo.extraData != null){
        if(this.globalData.openstate == "1"){
          this.globalData.openstate = "2"
          this.globalData.showstate = 2
          this.globalData.minroute = options.referrerInfo.extraData
        }
      }else{
        this.globalData.showstate = 1
      }
    }
  },
  globalData: {
    skey: "",
    minroute:"",
    showstate:"1",//小程序跳转成功的状态
    //urls: "http://192.168.1.90:9012",
    //urls:"http://eidop.com:9002",
    //urls: "http://192.168.1.66:9002",
    //urls: "http://192.168.1.58:9002",
    //urls: "https://m.useid.cn",
    urls: "https://m.useid.cn:9007",
    //urls: "http://192.168.1.171:9002",
    openstate:"1"
  },
  getLogin: function () {
    var skeys = this;
    // 登录
    wx.login({
      success: res => {
        wx.request({
          url: skeys.globalData.urls + '/order/onLogin',
          method: "post",
          data: {
            code: res.code
          },
          success: function (e) {
            console.log(e)
            if (e.data.dataObject) {
              skeys.globalData.skey = e.data.dataObject.skey;
            }
          }
        })
      }
    })
  }
})

