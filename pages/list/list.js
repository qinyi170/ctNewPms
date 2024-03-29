const app = getApp()
var utils = require("../../utils/util.js");
var plugin = requirePlugin("myPlugin");
let platform = '';
let scanDeviceTimer = null;
Page({
  data: {
    roomInfo:"",
    roomstate: "1",//显示订单列表
    appid: "wxabf18d9b8b4e2490",//wxabf18d9b8b4e2490 wx040d0b5da4f5858e
    path: "pages/welcome/welcome",
    version: "trial",//develop开发版 trial测试版
    datas: "",
    checkState:"",
    textstate:"1",
    medalstate: "1",
    medalmsg:"1",//锁的显示方式
    enable: true,
    state: '请点击按钮开锁',
    enablestate: "立即开门",
    keyParams: "",
    medaltitlestate:"1",
    scrollheight: "height:" + (app.globalData.pheight - 6-48) + "px",
    openshowuserorder:"1"
  },
  onLoad: function () { 
    platform = wx.getSystemInfoSync().system.split(' ')[0].toLowerCase();
  },
  onShow:function(){
    console.log("openshowuserorder " + this.data.openshowuserorder)
    console.log("showstate " + app.globalData.showstate)
    if (this.data.openshowuserorder == "1"){
      this.showUserOrder(1);
    }
    if (this.data.openshowuserorder == "2" && app.globalData.showstate == "1"){
      this.setData({
        openshowuserorder:1
      })
      this.showUserOrder(1);
    }
    if (app.globalData.showstate=="2"){
      this.changeOrderState();
    }
  },
  //入住时提示
  minibtn:function(e){
    if (e.currentTarget.dataset.lockid=="0"){
      utils.alertViewNosucces("提示", "房屋未绑锁，暂不能入住", false);
      return;
    }
    utils.alertViewNosucces("提示", "您的订单未到入住时间，请联系房东变更入住时间", false);
  },
  //初始化加载数据
  showUserOrder:function(data1){
    var athis = this;
    utils.showLoading("请稍等")
    utils.request("/order/showUserOrder", {
      "skey": app.globalData.skey,
      "startSize": "0"
    }, function (res1) {
      console.log("showUserOrder",res1)
      wx.hideLoading()
      if (res1.data.result == "0") {
        if (res1.data.dataObject != null) {
          athis.setData({
            roomstate: "2",
            ordersinfo: res1.data.dataObject,
            medaltitlestate: "1"
          })
          if (app.globalData.showstate == "2"){
            app.globalData.showstate = "1",
            athis.setData({
              medalstate: "2"
            })
          }
          if (data1=="9999"){
            athis.otherLock(athis.data.oauthcode);
          }
        } else {
          athis.setData({
            roomstate: "1",
          })
        }
      } else if (res1.data.result == "2"){
        utils.alertView("提示", "你已退出，请点击“确认”重新登录", function () {
          app.getLogin();
        })
      } else {
        if (!res1.data.result) {
          utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
          return;
        }
        utils.alertViewNosucces("提示", res1.data.message+"", false);
      }
    })
  },
  //判断其它锁的情况
  otherLock: function (oauthcode){
    utils.request("/order/otherLock", {
      "skey": app.globalData.skey,
      "oauth_code": oauthcode
    }, function (res2) {
      console.log("otherLock",res2)
      if (res2.data.result == "0") {
        utils.alertViewNosucces("提示", res2.data.message + "", false);
      } else {
        if (!res2.data.result) {
          utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
          return;
        }
        utils.alertViewNosucces("提示", res2.data.message + "", false);
      }
    })
  },
  //更新订单的状态
  changeOrderState:function(){
    var athis=this;
    utils.showLoading("请稍等")
    utils.request("/order/identifyResult", {
      "data": app.globalData.minroute,
      "skey": app.globalData.skey
    }, function (res1) {
      console.log("identifyResult",res1);
      athis.setData({
        openshowuserorder:"1"
      })
      wx.hideLoading()
      if (res1.data.result == "0") {
        if (res1.data.errorCode=="0200"){
          athis.setData({
            mima: JSON.parse(res1.data.dataObject).pwd,
            medalmsg:"3"
          })
        }
        if (res1.data.errorCode == "0100") {
          athis.setData({
            medalmsg: "2"
          })
        }
        if (res1.data.errorCode == "0000") {
          var s = res1.data.dataObject
          var roomss={
            "lockMac": s.lockMac,
            "uid": s.uid,
            lockName: s.lockName,
            "lockVersion": {
              "showAdminKbpwdFlag": s.lockVersion.showAdminKbpwdFlag,
              "groupId": s.lockVersion.groupId,
              "protocolVersion": s.lockVersion.protocolVersion,
              "protocolType": s.lockVersion.protocolType,
              "orgId": s.lockVersion.orgId,
              "logoUrl": s.lockVersion.logoUrl,
              "scene": s.lockVersion.scene
            },
            timezoneRawOffSet: s.timezoneRawOffset,
            "startDate": s.startDate,
            "endDate": s.endDate,
            "lockKey": s.lockKey,
            lockFlagPos: s.lockFlagPos,
            aesKeyStr: s.aesKeyStr
          }
          athis.setData({
            keyParams: roomss,
            medalmsg: "1"
          })
        }
        if (res1.data.errorCode == "9999"){
          app.globalData.showstate = "1";
        }
        athis.showUserOrder(res1.data.errorCode);
      } else if (res1.data.result == "2") {
        utils.alertView("提示", "你已退出，请点击“确认”重新登录", function () {
          app.getLogin();
        })
      } else {
        app.globalData.showstate = "1";
        athis.showUserOrder(1);
        if (!res1.data.result) {
          utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
          return;
        }
        utils.alertViewNosucces("提示", res1.data.message + "", false);
      }
    })
  },
  //转发功能
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
  },
  closemedal:function(){
    this.setData({
      medalstate:"1"
    })
  },
  //开锁
  openroom:function(e){
    var athis=this;
    var oauthcode = e.currentTarget.dataset.oauthcode;
    var locktype = e.currentTarget.dataset.locktype;
    if (locktype =="0000"){
      athis.setData({
        medalmsg: "1"
      })
    } else if (locktype == "0100") {
      athis.setData({
        medalmsg: "2"
      })
    } else if (locktype == "0200") {
      athis.setData({
        medalmsg: "3"
      })
    } else if (locktype == "9999") {
      athis.otherLock(oauthcode);
      return;
    }
    if (athis.data.medalmsg == "1"){
      utils.showLoading("请稍等");
      utils.request("/order/blueLock", {
        "oauth_code": oauthcode,
        "skey": app.globalData.skey
      }, function (res1) {
        console.log(res1)
        wx.hideLoading();
        if (res1.data.result == "0") {
          var s = res1.data.dataObject
          var roomss = {
            "lockMac": s.lockMac,
            "uid": s.uid,
            lockName: s.lockName,
            "lockVersion": {
              "showAdminKbpwdFlag": s.lockVersion.showAdminKbpwdFlag,
              "groupId": s.lockVersion.groupId,
              "protocolVersion": s.lockVersion.protocolVersion,
              "protocolType": s.lockVersion.protocolType,
              "orgId": s.lockVersion.orgId,
              "logoUrl": s.lockVersion.logoUrl,
              "scene": s.lockVersion.scene
            },
            timezoneRawOffSet: s.timezoneRawOffset,
            "startDate": s.startDate,
            "endDate": s.endDate,
            "lockKey": s.lockKey,
            lockFlagPos: s.lockFlagPos,
            aesKeyStr: s.aesKeyStr
          }
          athis.setData({
            keyParams: roomss,
            medalstate: "2",
            medaltitlestate: "2"
          })
        } else {
          if (!res1.data.result) {
            utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
            return;
          }
          utils.alertViewNosucces("提示", res1.data.message + "", false);
        }
      })
    } else if (athis.data.medalmsg == "2"){
      athis.setData({
        medalstate: "2",
        medaltitlestate: "2"
      })
    } else if (athis.data.medalmsg == "3"){  
      athis.getmin(oauthcode);
    }
  },
  //获取锁密码
  getmin: function (oauthcode){
    utils.showLoading("请稍等");
    var athis=this;
    utils.request("/order/passwordLock", {
      "oauth_code": oauthcode,
      "skey": app.globalData.skey
    }, function (res1) {
      wx.hideLoading();
      if (res1.data.result == "0") {
        athis.setData({
          mima: JSON.parse(res1.data.dataObject).pwd,
          medalstate: "2",
          medaltitlestate: "2"
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
  //退房
  exitroom:function(e){
    var athis=this
    wx.showModal({
      title: '提示',
      content: '确定要退订？',
      success(res) {
        if (res.confirm) {
          utils.showLoading("请稍等")
          utils.request("/order/retreatOrder", {
            "order_id": e.currentTarget.dataset.orderid,
            "skey": app.globalData.skey
          }, function (res1) {
            wx.hideLoading()
            if (res1.data.result == "0") {
              wx.showToast({
                title: "退订成功",
                icon: "none",
              });
              setTimeout(function () {
                athis.showUserOrder(1);
              }, 1500)
            } else {
              if (!res1.data.result) {
                utils.alertViewNosucces("提示", "服务未响应，请稍后再试", false);
                return;
              }
              utils.alertViewNosucces("提示", res1.data.message + "", false);
            }
          })
        }
      }
    }) 
  },
  gobindsuccess:function(e){
    app.globalData.openstate = "1"
    this.setData({
      openshowuserorder:"2",
      oauthcode:e.currentTarget.dataset.oauthcode
    })
  },


  /**
   * iOS搜索设备该接口回调目前ios有效
   */
  scanDeviceForExist() {
    let that = this;
    wx.onBluetoothDeviceFound(function (res) {
      that.scanForTargetDevice(res);
    })
  },

  /**
   * 搜索设备该接口回调android使用，非三代锁执行
   */
  scanDeviceForDynamic() {
    let that = this
    wx.getBluetoothDevices({
      success: function (res) {
        that.scanForTargetDevice(res);
      },
      fail: function (res) {
        clearTimeout(scanDeviceTimer);
        wx.stopBluetoothDevicesDiscovery({});
        this.setData({
          state: '搜索不到相关设备',
          enable: true
        });
      }
    })
  },

  /**
   * 搜索设备该接口回调android使用，非三代锁执行
   */
  scanForTargetDevice(res) {
    let that = this
    that.setData({
      state: '设备搜索中...'
    });
    
    let DeviceArray = res.devices;
    for (let i = 0; i < DeviceArray.length; i++) {
      console.log("-扫描周边蓝牙设备---devices==" + DeviceArray[i].name);
      if (DeviceArray[i].name == that.data.keyParams.lockName) {
        that.setData({
          state: '设备已找到, 正在开锁...'
        });
        clearTimeout(scanDeviceTimer);
        that.connect2BleLock(DeviceArray[i].deviceId);
        wx.stopBluetoothDevicesDiscovery({});
        return;
      }
    }
  },

  /**
   *  开锁借口调用
   */
  connect2BleLock(deviceId) {
    let that = this
    console.log('正在开锁---' + that.data.keyParams.lockName);
    console.log(that.data.keyParams);
    plugin.UnlockBleLock(deviceId, that.data.keyParams.uid, that.data.keyParams.lockVersion, that.data.keyParams.startDate, that.data.keyParams.endDate, that.data.keyParams.lockKey, that.data.keyParams.lockFlagPos, that.data.keyParams.aesKeyStr, that.data.keyParams.timezoneRawOffSet, that.openDoorResultCallBack);
  },
  /**
   * 开锁结果回调
   * @params res 开锁返回结果参数
   */
  openDoorResultCallBack(res) {
    var athis = this;
    console.log('开锁返回结果', res);
    let result = res.success === 1 ?
      '开锁成功' :
      '开锁失败';
    setTimeout(function () {
      athis.setData({
        enable: true,
        state: result,
        enablestate: "立即开门"
      });
    }, 5000)
  },

  /** 
   * 执行开锁操作（入口）
   */
  lanyaopen() {
    let that = this;
    that.setData({
      enable: false,
      state: '正在开启蓝牙设备',
      enablestate:"开启中"
    });
    wx.openBluetoothAdapter({
      success: function (res) {
        /** 三代锁并且是android 则可以直接连接 **/
        if (plugin.getLockType(that.data.keyParams.lockVersion) === plugin.LOCK_TYPE_V3 && platform === "android") {
          that.setData({
            state: '安卓搜索三代锁并尝试开启中...'
          });
          that.connect2BleLock(that.data.keyParams.lockMac);
        } else {
          /** 开启蓝牙设备搜索 **/
          that.setData({
            state: '正在开启蓝牙设备搜索...'
          });
          wx.startBluetoothDevicesDiscovery({
            services: [plugin.LOCK_BLE_UUID],
            allowDuplicatesKey: false,
            interval: 0,
            success: function (res) {
              // 搜索设备超时
              scanDeviceTimer = setTimeout(() => {
                wx.stopBluetoothDevicesDiscovery({});
                that.setData({
                  state: '搜索不到相关设备,停止搜索',
                  enable: true
                })
              }, 10000)

              /** 获取设备平台信息android和ios有部分回调表现有差异 **/
              if (platform == "ios") {
                that.scanDeviceForExist(that.data.keyParams);
              } else {
                that.scanDeviceForDynamic(that.data.keyParams);
              }
            },
            fail: function (res) {
              that.setData({
                state: '开启蓝牙设备搜索失败',
                enable: true
              })
            }
          })
        }
      },
      fail: function (res) {
        utils.alertViewNosucces("提示", "您还没有开启蓝牙，请开启", false);
        wx.onBluetoothAdapterStateChange(function (res) {
          if (res.available) {
            utils.showLoading("开启中...");
            setTimeout(function () {
              wx.hideLoading();
            }, 4000);
          }
        })
        that.setData({
          enablestate: "立即开启",
          enable: true,
          state: '开启蓝牙设备失败',
        });
      }
    })
  }
})