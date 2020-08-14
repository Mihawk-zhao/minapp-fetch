/*
 * @Author: your name
 * @Date: 2020-01-26 16:53:50
 * @LastEditTime: 2020-06-06 08:56:17
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /minapp-fetch/src/fetch/pay/pay.ts
 */

import { getBaaSF } from './utils/utils'
import {TPayWay, IPayParams} from './types'
import {PLATFORM_NAME_BAAS, PLATFORM_NAME} from './constants/constants'
import { PAY_WAY_ERROR, METHOD_NOT_SUPPORT, PAY_WAY_PLATFORM_ERROR } from './constants/error'


//
function fetchPay(way: TPayWay, params: IPayParams): Promise<any>{
  let {BaaS_F, minapp} = getBaaSF()

  if(PLATFORM_NAME_BAAS.indexOf(minapp) > -1){
    if(minapp === PLATFORM_NAME.WEB){
      let platform = ''
      switch(way){
        case PLATFORM_NAME.ALIPAY:
          platform = 'payWithAlipay'
          break
        case PLATFORM_NAME.WEAPP:
          platform = 'payWithWechat'
          break
        case PLATFORM_NAME.QQ:
          platform = 'payWithQQ'
          break
        default:
          throw new Error(PAY_WAY_ERROR)
      }
      return new Promise<any>((resolve, reject)=>{
        BaaS_F.payment[platform](params).then((res: any) => {
          // success
          resolve(res)
        }, (err: any) => {
          // HError 对象
          reject(err)
        })
      })
    }
    if(minapp !== way){
      throw new Error(PAY_WAY_PLATFORM_ERROR + minapp)
    }
    return new Promise<any>((resolve, reject)=>{
      BaaS_F.pay(params).then((res: any) => {
        // success. 支付请求成功响应，可以在 res 中拿到 transaction_no 和支付结果信息
        resolve(res)
      }, (err: any) => {
        // HError 对象
        reject(err)
      })
    })
  }

  //webapi
  if(minapp === PLATFORM_NAME.WEBAPI){
    throw new Error(`minapp.pay ${METHOD_NOT_SUPPORT}`)
  }

  //op 运营后台
  if(minapp === PLATFORM_NAME.OP){
    throw new Error(`minapp.pay ${METHOD_NOT_SUPPORT}`)
  }

  return new Promise<any>((resolve, reject)=>{
    resolve({})
  })
}


export default fetchPay