import { PLATFORM_NAME_ARR, PLATFORM_NAME } from '../constants/constants'
import { ARGS_ERROR, PLATFORM_ERROR, CLIENT_ID_ERROR } from '../constants/error'


//生成参数对象
export function setArgs(args: ['alipay' | 'cloud' | 'op' | 'qq' | 'swan' | 'weapp' | 'tt' | 'web' | 'webapi', {clientID?: string, host?: string, accessToken?: string, env?: string}]){
  if(args.length === 0){
    throw new Error(ARGS_ERROR)
  }
  let Platform:string = '',
      RequestBase:string ='',
      options: {
        clientID?: string, 
        host?: string, 
        accessToken?: string, 
        env?: string
      } = {},
      Header:{
        'Content-Type'?: string
        'X-Hydrogen-Client-ID'?: string,
        'Authorization'?: string,
        'X-Hydrogen-Env-ID'?: string,
      } = {}
  if(PLATFORM_NAME_ARR.indexOf(args[0]) === -1){
    throw new Error(PLATFORM_ERROR)
  }
  [Platform, options] = args
  if(options){
    if(!options.clientID){
      throw new Error(CLIENT_ID_ERROR)
    }
    RequestBase = options.host || `https://${options.clientID}.myminapp.com`
    Header = {
      'Content-Type': 'application/json',
      'X-Hydrogen-Client-ID': options.clientID,
    }
    if(options.accessToken){
      Header['Authorization'] = `Hydrogen-r1 ${options.accessToken}`
    }
    if(options.env){
      Header['X-Hydrogen-Env-ID'] = options.env
    }
  }
  return{
    Platform,
    RequestBase,
    Header
  }
}

//根据平台，返回请求方式， BaaS/axios
export function getBaaSF(ArgsObj: {
  Platform?: string | undefined
  RequestBase?: string | undefined
  Header?: {
    'Content-Type'?: string
    'X-Hydrogen-Client-ID'?: string,
    'Authorization'?: string,
    'X-Hydrogen-Env-ID'?: string,
  }
}){
  switch(ArgsObj.Platform){
    case PLATFORM_NAME.ALIPAY:
      // @ts-ignore：无法找到my的错误
      return my.BaaS
    case PLATFORM_NAME.CLOUD:
      // @ts-ignore：无法找到BaaS的错误
      return BaaS
    case PLATFORM_NAME.OP:
      return require('axios').create({
        withCredentials: true
      })
    case PLATFORM_NAME.QQ:
      // @ts-ignore：无法找到qq的错误
      return qq.BaaS
    case PLATFORM_NAME.SWAN:
      // @ts-ignore：无法找到swan的错误
      return swan.BaaS
    case PLATFORM_NAME.WEAPP:
      // @ts-ignore：无法找到wx的错误
      return wx.BaaS
    case PLATFORM_NAME.TT:
      // @ts-ignore：无法找到tt的错误
      return tt.BaaS
    case PLATFORM_NAME.WEB:
      // @ts-ignore：无法找到window的错误
      return window.BaaS
    case PLATFORM_NAME.WEBAPI:
      return require('axios').create({
        withCredentials: true
      })
    default:
      throw new Error(PLATFORM_ERROR)
  }
}







export const isArray = (value: any) => {
  return Object.prototype.toString.call(value) === '[object Array]'
}

// 目前仅支持对象或数字的拷贝
export const cloneDeep = (source: any) => {
  if (source === undefined || source === null) return Object.create(null)
  const target = isArray(source) ? [] : Object.create(Object.getPrototypeOf(source))
  for (const keys in source) {
    if (source.hasOwnProperty(keys)) {
      if (source[keys] && typeof source[keys] === 'object') {
        target[keys] = isArray(source[keys]) ? [] : {}
        target[keys] = cloneDeep(source[keys])
      } else {
        target[keys] = source[keys]
      }
    }
  }
  return target
}

// 返回新增的对象，geopoint化
export const changeSetParams = (params: any) => {
  let changeData = params
  for(let p in params){
    if(isArray(params[p])){
      if(params[p][0] === 'geo'){
        if(isArray(params[p][1])){
          let temp = params[p]
          temp.shift()
          if(temp.length > 1){
            changeData[p] = cloneDeep({
              type: 'Polygon',
              coordinates: [temp]
            })
          }else{
            changeData[p] = cloneDeep({
              type: 'Point',
              coordinates: temp[0]
            })
          }
        }
      }
    }
  }
  return changeData
}

export const changeSetManyParams = (params: any) => {
  let change = []
  for(let i = 0; i < params.length; i++){
    change.push(changeSetParams(params[i]))
  }
  return change
}


// 返回geojson
export const changeFindGeoJson = (lparams: any) => {  //['point', 'include', [23, 32]]
  let temp = []  
  if(lparams[1] === 'within'){
    lparams.splice(0,2)
    temp = cloneDeep({
      type: 'Polygon',
      coordinates: [lparams]
    })
  }else{
    temp = cloneDeep({
      type: 'Point',
      coordinates: lparams[2]
    })
  }
  return temp
}

