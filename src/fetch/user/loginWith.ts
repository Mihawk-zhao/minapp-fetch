/*
 * @Author: your name
 * @Date: 2020-01-27 13:18:41
 * @LastEditTime: 2020-06-13 09:54:18
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /minapp-fetch/src/fetch/user/loginWith.ts
 */

import { setArgs, getBaaSF } from '../../utils/utils'
import { PLATFORM_NAME } from '../../constants/constants'
import { METHOD_NOT_SUPPORT, PLATFORM_ERROR } from '../../constants/error'

let ArgsObj: {
  Platform?: string | undefined
  RequestBase?: string | undefined
  Header?: {
    'Content-Type'?: string
    'X-Hydrogen-Client-ID'?: string,
    'Authorization'?: string,
    'X-Hydrogen-Env-ID'?: string,
  }
}

//
function fetchLoginWith(...data: [
  any,
  {
    createUser?: boolean
    syncUserProfile?: 'overwrite' | 'setnx' | 'false',
    withUnionID?: boolean
  }
]){
  let BaaS_F = getBaaSF(ArgsObj)
  if(!ArgsObj.Platform){
    throw new Error(PLATFORM_ERROR)
  }
  switch(ArgsObj.Platform){
    case PLATFORM_NAME.ALIPAY:
      return new Promise((resolve, reject)=>{
        BaaS_F.auth.loginWithAlipay(...data).then((user: any) => {
          // 登录成功
          resolve(user)
        }, (err: any) => {
          // 登录失败
          reject(err)
        })
      })
    case PLATFORM_NAME.QQ:
      return new Promise((resolve, reject)=>{
        BaaS_F.auth.loginWithQQ(...data).then((user: any) => {
          // 登录成功
          resolve(user)
        }, (err: any) => {
          // 登录失败
          reject(err)
        })
      })
    case PLATFORM_NAME.SWAN:
      return new Promise((resolve, reject)=>{
        BaaS_F.auth.loginWithBaidu(...data).then((user: any) => {
          // 登录成功
          resolve(user)
        }, (err: any) => {
          // 登录失败
          reject(err)
        })
      })
    case PLATFORM_NAME.WEAPP:
      return new Promise((resolve, reject)=>{
        BaaS_F.auth.loginWithWechat(...data).then((user: any) => {
          // 登录成功
          resolve(user)
        }, (err: any) => {
          // 登录失败
          reject(err)
        })
      })
    case PLATFORM_NAME.TT:
      return new Promise((resolve, reject)=>{
        BaaS_F.auth.loginWithTt(...data).then((user: any) => {
          // 登录成功
          resolve(user)
        }, (err: any) => {
          // 登录失败
          reject(err)
        })
      })
    case PLATFORM_NAME.JD:
      return new Promise((resolve, reject)=>{
        BaaS_F.auth.loginWithJd(...data).then((user: any) => {
          // 登录成功
          resolve(user)
        }, (err: any) => {
          // 登录失败
          reject(err)
        })
      })
    default:
      throw new Error(`minapp.loginWith ${METHOD_NOT_SUPPORT}`)
  }
}


function initFetchLoginWith(args: ['alipay' | 'cloud' | 'op' | 'qq' | 'swan' | 'weapp' | 'tt' | 'web' | 'webapi' | 'rn'  | 'jd', {clientID?: string, host?: string, accessToken?: string, env?: string}]){
  ArgsObj = setArgs(args)
  return fetchLoginWith
}

export default initFetchLoginWith