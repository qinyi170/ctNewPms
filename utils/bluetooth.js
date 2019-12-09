/*
  1.1、关闭蓝牙模块，使其进入未初始化状态。断开所有已建立的链接并释放系统资源
  1.2、打开小程序蓝牙模块
  1.3、开始搜寻附近的蓝牙外围设备
  1.4、监听寻找到新设备的事件
  1.5、找到需要的蓝牙设备后停止搜寻附近的蓝牙外围设备
  
  2.1、断开之前建立与低功耗蓝牙设备的连接
  2.2、建立新的蓝牙连接
  2.3、启动监听，监听蓝牙返回报文
  2.4、监听蓝牙报文返回后作处理（蓝牙返回的是二进制，将二进制转成16进制字符串）
  2.5、发送报文发送下发到蓝牙设备（蓝牙设备只接收二进制）
*/
var utils = require("./util.js");
function openBluetoothAdapter(fun = () => { }, call) {
  closeBluetoothAdapter({
    complete: () => {
      wx.openBluetoothAdapter({ // 打开蓝牙适配器
        success: () => {
          console.log("蓝牙适配器启动成功");
          fun(call);
        },
        fail: err => {
          if (err.errCode == "10001" || err.errMsg == "openBluetoothAdapter:fail:ble not available" || err.errMsg == "openBluetoothAdapter:fail:not available") {
            utils.alertViewNosucces("提示", "您还没有开启蓝牙，请开启", false);
            return;
          }
        }
      })
    }
  });
}

function closeBluetoothAdapter({
  complete = res => console.log(res, "调用关闭蓝牙适配器接口"), // 调用关闭蓝牙适配器的回调
}) {
  wx.closeBluetoothAdapter({ // 关闭蓝牙适配器
    complete: complete
  })
}

/**
 * call: 搜索到设备后的处理流程，需要根据不同的场景去单独实现
 */
function startBluetoothDevicesDiscovery(call) {
  stopBluetoothDevicesDiscovery(() => {
    wx.startBluetoothDevicesDiscovery({
      success: () => {
        console.log("开始搜寻附近的蓝牙外围设备");
        wx.onBluetoothDeviceFound(call);
      },
      fail: () => console.log("搜寻附近的蓝牙外围设备失败")
    });
    setTimeout(stopBluetoothDevicesDiscovery, 30000); // 30 秒后停止搜索蓝牙设备
  });
}

function stopBluetoothDevicesDiscovery(complete = () => console.log("停止搜寻附近的蓝牙外围设备")) {
  wx.stopBluetoothDevicesDiscovery({
    complete: complete
  });
}

function createBLEConnection(p) {
  if (p.oldDeviceId) {
    closeBLEConnection(p, connection);
  } else {
    connection(p);
  }
}

function closeBLEConnection(p, complete = () => { }) {
  wx.closeBLEConnection({
    deviceId: p.oldDeviceId,
    complete() {
      complete(p);
    },
  })
  wx.closeBLEConnection({
    complete: complete
  })
}

function connection({
  lockname,
  deviceId,//设备id
  serviceId,//服务id
  notifyCharacteristicId,//状态变化特征值
  createBLEConnectionSuccess = () => { },//链接建立成功后回调 
  onBLECharacteristicValueChange = hex => console.log(hex),//接受到设备返回报文后的回调
  success = () => { }//监听启动成功可以进行下一步操作
}) {
  wx.createBLEConnection({
    deviceId: deviceId,
    success() {
      console.log("连接蓝牙成功: {lockname: " + lockname + ", deviceId: " + deviceId + "}");
      createBLEConnectionSuccess();
      // 启动监听，监听蓝牙返回报文
      wx.notifyBLECharacteristicValueChange({
        deviceId: deviceId,
        serviceId: serviceId,
        characteristicId: notifyCharacteristicId,
        state: true,
        success() {
          console.log("启用监听");
          wx.onBLECharacteristicValueChange(({ value }) => {
            console.log("开始接收蓝牙返回的报文");
            let hexStr = byte2hexStr(value);
            onBLECharacteristicValueChange(hexStr);
            console.log("回调成功。。。");
          });
          // 监听启动成功开始发送数据
          success();
        },
        fail(res) {
          console.log("启用notify失败", res);
          wx.hideLoading();
        }
      });
    },
    fail() {
      console.log("连接蓝牙失败: {lockname: " + lockname + ", deviceId: " + deviceId + "}");
      wx.hideLoading();
    }
  })
}

function hexStr2byte(hexStr) {
  return new Int8Array(hexStr.match(/[\da-f]{2}/gi).map(hexStr => parseInt(hexStr, 16))).buffer
}

function byte2hexStr(bytes) {
  let hexStr = "";
  ([...new Int8Array(bytes)]).forEach(e => hexStr += (((e >> 4) & 0xF).toString(16) + (e & 0xF).toString(16)));
  return hexStr;
}

module.exports = {
  closeBluetoothAdapter,
  openBluetoothAdapter,
  startBluetoothDevicesDiscovery,
  stopBluetoothDevicesDiscovery,
  createBLEConnection,
  closeBLEConnection,
  hexStr2byte,
  byte2hexStr
}