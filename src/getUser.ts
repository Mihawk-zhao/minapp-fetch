/*
 * @Author: your name
 * @Date: 2020-05-18 18:02:23
 * @LastEditTime: 2020-06-06 08:54:18
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /@ownpack/weapp/src/fetch/userGroup/getUser.ts
 */ 

import { getBaaSF } from './utils/utils'
import { PLATFORM_NAME_BAAS, PLATFORM_NAME } from './constants/constants'
import { WEBAPI_OPTIONS_ERROR } from './constants/error'
import {IGetParams} from './types'

function fetchGetUser(uid: number, params?: IGetParams): Promise<any>{
  let {BaaS_F, minapp, options} = getBaaSF()
  if(PLATFORM_NAME_BAAS.indexOf(minapp) > -1){
    return new Promise((resolve, reject)=>{
      let MyUser = new BaaS_F.User()
      MyUser.expand(params?.expand || []).select(params?.select || []).get(uid).then((res: any) => {
        // success
        resolve(res)
      }, (err: any) => {
        // err
        reject(err)
      })
    })
  }

  //webapi
  if(minapp === PLATFORM_NAME.WEBAPI){
    return new Promise<any>((resolve, reject)=>{
      if(!options) throw new Error(WEBAPI_OPTIONS_ERROR)
      BaaS_F({
        method: 'get',
        url: `${options.RequestBase}/hserve/v2.2/user/info/${uid}/`,
        headers: options.Header,
        params: {
          expand: (params?.expand || []).toString(),
          keys: (params?.select || []).toString(),
        }
      }).then((res: any) => {
        resolve(res)
      }).catch((err: any) => {
        reject(err)
      })
    })
  }
  
  //op 运营后台
  if(minapp === PLATFORM_NAME.OP){
    return new Promise<any>((resolve, reject) => {
      BaaS_F.get(`https://cloud.minapp.com/userve/v2.0/miniapp/user_profile/${uid}/`)
      .then((res: any) => {
        resolve(res)
      }).catch((err: any) => {
        reject(err)
      })
    })
  }

  return new Promise<any>((resolve, reject)=>{
    resolve({})
  })
}

export default fetchGetUser