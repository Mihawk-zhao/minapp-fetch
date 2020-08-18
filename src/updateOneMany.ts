
import { getBaaSF, cloneDeep, isArray, changeFindGeoJson } from './utils/utils'
import { UPDATE_METHORD, PLATFORM_NAME, PLATFORM_NAME_BAAS } from './constants/constants'
import { FIND_R_ERROR, FIND_CHECKR_ERROR, FIND_P_ERROR, UPDATE_ERROR, WEBAPI_OPTIONS_ERROR } from './constants/error'
import {TTable, IUpdateManyParams} from './types'


function fetchUpdateOneMany(table: TTable, params: IUpdateManyParams): Promise<any>{
  let {BaaS_F, minapp, options} = getBaaSF()

  if(PLATFORM_NAME_BAAS.indexOf(minapp) > -1){
    return new Promise<any>((resolve, reject)=>{
      let MyTableObject = new BaaS_F.TableObject(table)
  
      if(!params.r){
        throw new Error(FIND_R_ERROR)
      }
      let r = params.r.replace(/\s+/g,'')       //去掉空格
      let query: any = {}
  
      let checkR = r.replace(/[^\(\)]/g, '')
      while(/\(\)/g.test(checkR)){
        checkR = checkR.replace(/\(\)/g,"")
      }
      //是否有多的括号，(
      if(checkR){
        throw new Error('"' + checkR + '": ' + FIND_CHECKR_ERROR)
      }
  
      let stack = []   //栈
      let topBrackets = ''     //最近的一个括号里的内容
      let stackTop: string | undefined = ''     //栈顶的内容
      let list = r.replace(/(\()|(\))/g, '#$1$2#').split(/#/g)
  
      //1.将所有p转换成query类型
      let ps = r.replace(/\(|\)/g, '').split(/&&|\|\|/g)
      for(let i = 0; i < ps.length; i++){
        query[ps[i]] = new BaaS_F.Query()
        switch(params[ps[i]][1]){
          case 'in':
            query[ps[i]].in(params[ps[i]][0], params[ps[i]][2])
            break
          case 'notIn':
            query[ps[i]].notIn(params[ps[i]][0], params[ps[i]][2])
            break
          case 'contains':
            query[ps[i]].contains(params[ps[i]][0], params[ps[i]][2])
            break
          case 'arrayContains':
            query[ps[i]].arrayContains(params[ps[i]][0], params[ps[i]][2])
            break
          case 'matches':
            query[ps[i]].matches(params[ps[i]][0], params[ps[i]][2])
            break
          case 'stringLength':
            let reg
            if(params[ps[i]].length > 3){
              reg = new RegExp(`^.{${params[ps[i]][2]},${params[ps[i]][3]}}$`)
            }else{
              reg = new RegExp(`^.{${params[ps[i]][2]}}$`)
            }
            query[ps[i]].matches(params[ps[i]][0], reg)
            break
          case 'hasKey':
            query[ps[i]].hasKey(params[ps[i]][0], params[ps[i]][2])
            break
          case 'include':
            query[ps[i]].include(params[ps[i]][0], new BaaS_F.GeoPoint(params[ps[i]][2][0], params[ps[i]][2][1]))
            break
          case 'withinCircle':
            query[ps[i]].withinCircle(params[ps[i]][0], new BaaS_F.GeoPoint(params[ps[i]][2][0], params[ps[i]][2][1]), params[ps[i]][3])
            break
          case 'withinRegion':
            query[ps[i]].withinRegion(params[ps[i]][0], new BaaS_F.GeoPoint(params[ps[i]][2][0], params[ps[i]][2][1]), params[ps[i]][3], params[ps[i]][4] || 0)
            break
          case 'within':
            let tempGeo = params[ps[i]]
            tempGeo.splice(0,2)
            query[ps[i]].within(params[ps[i]][0], new BaaS_F.GeoPolygon(tempGeo))
            break;
          case 'isNull':
            params[ps[i]][2] ? query[ps[i]].isNull(params[ps[i]][0]) : query[ps[i]].isNotNull(params[ps[i]][0])
            break
          case 'isExists':
            params[ps[i]][2] ? query[ps[i]].exists(params[ps[i]][0]) : query[ps[i]].notExists(params[ps[i]][0])
            break
          case '=':
            query[ps[i]].compare(params[ps[i]][0], '=', params[ps[i]][2])
            break
          case '!=':
            query[ps[i]].compare(params[ps[i]][0], '!=', params[ps[i]][2])
            break
          case '<':
            query[ps[i]].compare(params[ps[i]][0], '<', params[ps[i]][2])
            break
          case '<=':
            query[ps[i]].compare(params[ps[i]][0], '<=', params[ps[i]][2])
            break
          case '>':
            query[ps[i]].compare(params[ps[i]][0], '>', params[ps[i]][2])
            break
          case '>=':
            query[ps[i]].compare(params[ps[i]][0], '>=', params[ps[i]][2])
            break
          default:
            throw new Error(FIND_P_ERROR)
        }
      }
  
      for(let i = 0; i < list.length; i++){
        if(list[i] === ')'){
          //出栈
          stackTop = stack.pop()
          while (stackTop !== '(') {
            topBrackets = stackTop + topBrackets
            stackTop = stack.pop()
          }
          //进行and,or
          let tempArr = topBrackets.replace(/(&&)|(\|\|)/g, '#$1$2#').split(/#/g)
          // [p9, &&, p8, ||, p32]
          let tempQQ = query[tempArr[0]], n = 0
          while(n < tempArr.length - 1){
            if(tempArr[n+1] === '&&'){
              tempQQ = BaaS_F.Query.and(tempQQ, query[tempArr[n+2]])
            }
            if(tempArr[n+1] === '||'){
              tempQQ = BaaS_F.Query.or(tempQQ, query[tempArr[n+2]])
            }
            n += 2
          }
          query[`pp${i}`] = tempQQ
          topBrackets = `pp${i}`
          stack.push(topBrackets)
          topBrackets = ''
          continue
        }else{
          //入栈
          stack.push(list[i])
        }
      }
      let tempArr2 = stack.toString().replace(/,/g, '').replace(/(&&)|(\|\|)/g, '#$1$2#').split(/#/g)
      // [p9, &&, pp8, ||, p32]
      let QQ = query[tempArr2[0]], n = 0
      while(n < tempArr2.length - 1){
        if(tempArr2[n+1] === '&&'){
          QQ = BaaS_F.Query.and(QQ, query[tempArr2[n+2]])
        }
        if(tempArr2[n+1] === '||'){
          QQ = BaaS_F.Query.or(QQ, query[tempArr2[n+2]])
        }
        n += 2
      }
  
  
      let records = MyTableObject.limit(params.limit || 20).offset((params.limit || 20) * ((params.page || 1) - 1)).getWithoutData(QQ)
  
      let { u } = params
      for(let pa in u){
        if(!isArray(u[pa])){
          //不是数组，则直接 set
          records.set(pa, u[pa])
          continue
        }
        if(UPDATE_METHORD.indexOf(u[pa][0]) > -1 ){
          switch(u[pa][0]){
            case 'set':
              records.set(pa, u[pa][1])
              break
            case 'geo':
              let temp = u[pa], tempGeo = {}
              temp.shift()
              if(temp.length > 1){
                tempGeo = cloneDeep({
                  type: 'Polygon',
                  coordinates: [temp]
                })
              }else{
                tempGeo = cloneDeep({
                  type: 'Point',
                  coordinates: temp[0]
                })
              }
              records.set(pa, tempGeo)
              break
            case 'unset':
              records.unset(pa)
              break
            case 'incr':
              records.incrementBy(pa, u[pa][1])
              break
            case 'append':
              records.append(pa, Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]])
              break
            case 'uAppend':
              records.uAppend(pa, Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]])
              break
            case 'remove':
              records.remove(pa, Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]])
              break
            case 'patchObject':
              records.patchObject(pa, u[pa][1])
              break
            default:
              throw new Error(UPDATE_ERROR)
          }
        }else{
          //直接 set
          records.set(pa, u[pa])
        }
      }
      
      records.update({
        enableTrigger: params.enableTrigger === undefined ? true : params.enableTrigger,
        withCount: params.withCount || false
      }).then((res: any) => {
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
      if(!params.r){
        throw new Error(FIND_R_ERROR)
      }
      let r = params.r.replace(/\s+/g,'')       //去掉空格
      let query: any = {}
  
      let checkR = r.replace(/[^\(\)]/g, '')
      while(/\(\)/g.test(checkR)){
        checkR = checkR.replace(/\(\)/g,"")
      }
      //是否有多的括号，(
      if(checkR){
        throw new Error('"' + checkR + '": ' + FIND_CHECKR_ERROR)
      }
  
      let stack = []   //栈
      let topBrackets = ''     //最近的一个括号里的内容
      let stackTop: string | undefined = ''     //栈顶的内容
      let list = r.replace(/(\()|(\))/g, '#$1$2#').split(/#/g)
  
      //1.将所有p转换成query类型
      let ps = r.replace(/\(|\)/g, '').split(/&&|\|\|/g)
      for(let i = 0; i < ps.length; i++){
        query[ps[i]] = {}
        switch(params[ps[i]][1]){
          case 'in':
            query[ps[i]][params[ps[i]][0]] = {"$in": params[ps[i]][2]}
            break
          case 'notIn':
            query[ps[i]][params[ps[i]][0]] = {"$nin": params[ps[i]][2]}
            break
          case 'contains':
            query[ps[i]][params[ps[i]][0]] = {"$contains": params[ps[i]][2]}
            break
          case 'arrayContains':
            query[ps[i]][params[ps[i]][0]] = {"$all": params[ps[i]][2]}
            break
          case 'matches':
            query[ps[i]][params[ps[i]][0]] = {"$regex": params[ps[i]][2]}
            break
          case 'stringLength':
            let reg
            if(params[ps[i]].length > 3){
              reg = new RegExp(`^.{${params[ps[i]][2]},${params[ps[i]][3]}}$`)
            }else{
              reg = new RegExp(`^.{${params[ps[i]][2]}}$`)
            }
            query[ps[i]][params[ps[i]][0]] = {"$regex": reg}
            break
          case 'hasKey':
            query[ps[i]][params[ps[i]][0]] = {"$has_key": params[ps[i]][2]}
            break
          case 'include':
            query[ps[i]][params[ps[i]][0]] = {"$intersects": changeFindGeoJson(params[ps[i]])}
            break
          case 'withinCircle':
            query[ps[i]][params[ps[i]][0]] = {"$center": {
              radius: params[ps[i]][3] || 1,
              coordinates: [params[ps[i]][2][0], params[ps[i]][2][1]]
            }}
            break
          case 'withinRegion':
            query[ps[i]][params[ps[i]][0]] = {"$nearsphere": {
              geometry: changeFindGeoJson(params[ps[i]]),
              max_distance: params[ps[i]][3],
              min_distance: params[ps[i]][4] || 0
            }}
            break
          case 'within':
            query[ps[i]][params[ps[i]][0]] = {"$within": changeFindGeoJson(params[ps[i]])}
            break
          case 'isNull':
            query[ps[i]][params[ps[i]][0]] = {"$isnull": params[ps[i]][2]}
            break
          case 'isExists':
            query[ps[i]][params[ps[i]][0]] = {"$exists": params[ps[i]][2]}
            break
          case '=':
            query[ps[i]][params[ps[i]][0]] = {"$eq": params[ps[i]][2]}
            break
          case '!=':
            query[ps[i]][params[ps[i]][0]] = {"$ne": params[ps[i]][2]}
            break
          case '<':
            query[ps[i]][params[ps[i]][0]] = {"$lt": params[ps[i]][2]}
            break
          case '<=':
            query[ps[i]][params[ps[i]][0]] = {"$lte": params[ps[i]][2]}
            break
          case '>':
            query[ps[i]][params[ps[i]][0]] = {"$gt": params[ps[i]][2]}
            break
          case '>=':
            query[ps[i]][params[ps[i]][0]] = {"$gte": params[ps[i]][2]}
            break
          default:
            throw new Error(FIND_P_ERROR)
        }
      }
  
      for(let i = 0; i < list.length; i++){
        if(list[i] === ')'){
          //出栈
          stackTop = stack.pop()
          while (stackTop !== '(') {
            topBrackets = stackTop + topBrackets
            stackTop = stack.pop()
          }
          //进行and,or
          let tempArr = topBrackets.replace(/(&&)|(\|\|)/g, '#$1$2#').split(/#/g)
          // [p9, &&, p8, ||, p32]
          let tempQQ = query[tempArr[0]], n = 0
          while(n < tempArr.length - 1){
            if(tempArr[n+1] === '&&'){
              tempQQ = {
                "$and": [tempQQ, query[tempArr[n+2]]]
              }
            }
            if(tempArr[n+1] === '||'){
              tempQQ = {
                "$or": [tempQQ, query[tempArr[n+2]]]
              }
            }
            n += 2
          }
          query[`pp${i}`] = tempQQ
          topBrackets = `pp${i}`
          stack.push(topBrackets)
          topBrackets = ''
          continue
        }else{
          //入栈
          stack.push(list[i])
        }
      }
      let tempArr2 = stack.toString().replace(/,/g, '').replace(/(&&)|(\|\|)/g, '#$1$2#').split(/#/g)
      // [p9, &&, pp8, ||, p32]
      let QQ = query[tempArr2[0]], n = 0
      while(n < tempArr2.length - 1){
        if(tempArr2[n+1] === '&&'){
          QQ = {
            "$and": [QQ, query[tempArr2[n+2]]]
          }
        }
        if(tempArr2[n+1] === '||'){
          QQ = {
            "$or": [QQ, query[tempArr2[n+2]]]
          }
        }
        n += 2
      }

      let { u } = params
      let updata: any = {}
      for(let pa in u){
        if(!isArray(u[pa])){
          //不是数组，则直接 set
          updata[pa] = u[pa]
          continue
        }
        if(UPDATE_METHORD.indexOf(u[pa][0]) > -1 ){
          switch(u[pa][0]){
            case 'set':
              updata[pa] = u[pa][1]
              break
            case 'geo':
              let temp = u[pa], tempGeo = {}
              temp.shift()
              if(temp.length > 1){
                tempGeo = cloneDeep({
                  type: 'Polygon',
                  coordinates: [temp]
                })
              }else{
                tempGeo = cloneDeep({
                  type: 'Point',
                  coordinates: temp[0]
                })
              }
              updata[pa] = tempGeo
              break
            case 'unset':
              updata[pa] = {}
              updata[pa]['$unset'] = ''
              break
            case 'incr':
              updata[pa] = {}
              updata[pa]['$incr_by'] = u[pa][1]
              break
            case 'append':
              updata[pa] = {}
              updata[pa]['$append'] = Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]]
              break
            case 'uAppend':
              updata[pa] = {}
              updata[pa]['$append_unique'] = Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]]
              break
            case 'remove':
              updata[pa] = {}
              updata[pa]['$remove'] = Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]]
              break
            case 'patchObject':
              updata[pa] = {}
              updata[pa]['$update'] = u[pa][1]
              break
            default:
              throw new Error(UPDATE_ERROR)
          }
        }else{
          //直接 set
          updata[pa] = u[pa]
        }
      }
      
      if(!options) throw new Error(WEBAPI_OPTIONS_ERROR)
      BaaS_F({
        method: 'put',
        url: `${options.RequestBase}/hserve/v2.2/table/${table}/record/`,
        headers: options.Header,
        params: {
          where: QQ,
          limit: params.limit || 20,
          offset: (params.limit || 20) * ((params.page || 1) - 1),
          enable_trigger: params.enableTrigger === undefined ? true : params.enableTrigger,
          return_total_count: params.withCount ? 1 : 0,
        },
        data: updata
      }).then((res: any) => {
        resolve(res)
      }).catch((err: any) => {
        reject(err)
      })
    })
  }

  //op 运营后台
  if(minapp === PLATFORM_NAME.OP){
    return new Promise<any>((resolve, reject)=>{
      if(!params.r){
        throw new Error(FIND_R_ERROR)
      }
      let r = params.r.replace(/\s+/g,'')       //去掉空格
      let query: any = {}

      let checkR = r.replace(/[^\(\)]/g, '')
      while(/\(\)/g.test(checkR)){
        checkR = checkR.replace(/\(\)/g,"")
      }
      //是否有多的括号，(
      if(checkR){
        throw new Error('"' + checkR + '": ' + FIND_CHECKR_ERROR)
      }

      let stack = []   //栈
      let topBrackets = ''     //最近的一个括号里的内容
      let stackTop: string | undefined = ''     //栈顶的内容
      let list = r.replace(/(\()|(\))/g, '#$1$2#').split(/#/g)

      //1.将所有p转换成query类型
      let ps = r.replace(/\(|\)/g, '').split(/&&|\|\|/g)
      for(let i = 0; i < ps.length; i++){
        query[ps[i]] = {}
        switch(params[ps[i]][1]){
          case 'in':
            query[ps[i]][params[ps[i]][0]] = {"$in": params[ps[i]][2]}
            break
          case 'notIn':
            query[ps[i]][params[ps[i]][0]] = {"$nin": params[ps[i]][2]}
            break
          case 'contains':
            query[ps[i]][params[ps[i]][0]] = {"$contains": params[ps[i]][2]}
            break
          case 'arrayContains':
            query[ps[i]][params[ps[i]][0]] = {"$all": params[ps[i]][2]}
            break
          case 'matches':
            query[ps[i]][params[ps[i]][0]] = {"$regex": params[ps[i]][2]}
            break
          case 'stringLength':
            let reg
            if(params[ps[i]].length > 3){
              reg = new RegExp(`^.{${params[ps[i]][2]},${params[ps[i]][3]}}$`)
            }else{
              reg = new RegExp(`^.{${params[ps[i]][2]}}$`)
            }
            query[ps[i]][params[ps[i]][0]] = {"$regex": reg}
            break
          case 'hasKey':
            query[ps[i]][params[ps[i]][0]] = {"$has_key": params[ps[i]][2]}
            break
          case 'include':
            query[ps[i]][params[ps[i]][0]] = {"$intersects": changeFindGeoJson(params[ps[i]])}
            break
          case 'withinCircle':
            query[ps[i]][params[ps[i]][0]] = {"$center": {
              radius: params[ps[i]][3] || 1,
              coordinates: [params[ps[i]][2][0], params[ps[i]][2][1]]
            }}
            break
          case 'withinRegion':
            query[ps[i]][params[ps[i]][0]] = {"$nearsphere": {
              geometry: changeFindGeoJson(params[ps[i]]),
              max_distance: params[ps[i]][3],
              min_distance: params[ps[i]][4] || 0
            }}
            break
          case 'within':
            query[ps[i]][params[ps[i]][0]] = {"$within": changeFindGeoJson(params[ps[i]])}
            break
          case 'isNull':
            query[ps[i]][params[ps[i]][0]] = {"$isnull": params[ps[i]][2]}
            break
          case 'isExists':
            query[ps[i]][params[ps[i]][0]] = {"$exists": params[ps[i]][2]}
            break
          case '=':
            query[ps[i]][params[ps[i]][0]] = {"$eq": params[ps[i]][2]}
            break
          case '!=':
            query[ps[i]][params[ps[i]][0]] = {"$ne": params[ps[i]][2]}
            break
          case '<':
            query[ps[i]][params[ps[i]][0]] = {"$lt": params[ps[i]][2]}
            break
          case '<=':
            query[ps[i]][params[ps[i]][0]] = {"$lte": params[ps[i]][2]}
            break
          case '>':
            query[ps[i]][params[ps[i]][0]] = {"$gt": params[ps[i]][2]}
            break
          case '>=':
            query[ps[i]][params[ps[i]][0]] = {"$gte": params[ps[i]][2]}
            break
          default:
            throw new Error(FIND_P_ERROR)
        }
      }

      for(let i = 0; i < list.length; i++){
        if(list[i] === ')'){
          //出栈
          stackTop = stack.pop()
          while (stackTop !== '(') {
            topBrackets = stackTop + topBrackets
            stackTop = stack.pop()
          }
          //进行and,or
          let tempArr = topBrackets.replace(/(&&)|(\|\|)/g, '#$1$2#').split(/#/g)
          // [p9, &&, p8, ||, p32]
          let tempQQ = query[tempArr[0]], n = 0
          while(n < tempArr.length - 1){
            if(tempArr[n+1] === '&&'){
              tempQQ = {
                "$and": [tempQQ, query[tempArr[n+2]]]
              }
            }
            if(tempArr[n+1] === '||'){
              tempQQ = {
                "$or": [tempQQ, query[tempArr[n+2]]]
              }
            }
            n += 2
          }
          query[`pp${i}`] = tempQQ
          topBrackets = `pp${i}`
          stack.push(topBrackets)
          topBrackets = ''
          continue
        }else{
          //入栈
          stack.push(list[i])
        }
      }
      let tempArr2 = stack.toString().replace(/,/g, '').replace(/(&&)|(\|\|)/g, '#$1$2#').split(/#/g)
      // [p9, &&, pp8, ||, p32]
      let QQ = query[tempArr2[0]], n = 0
      while(n < tempArr2.length - 1){
        if(tempArr2[n+1] === '&&'){
          QQ = {
            "$and": [QQ, query[tempArr2[n+2]]]
          }
        }
        if(tempArr2[n+1] === '||'){
          QQ = {
            "$or": [QQ, query[tempArr2[n+2]]]
          }
        }
        n += 2
      }

      let { u } = params
      let updata: any = {}
      for(let pa in u){
        if(!isArray(u[pa])){
          //不是数组，则直接 set
          updata[pa] = u[pa]
          continue
        }
        if(UPDATE_METHORD.indexOf(u[pa][0]) > -1 ){
          switch(u[pa][0]){
            case 'set':
              updata[pa] = u[pa][1]
              break
            case 'geo':
              let temp = u[pa], tempGeo = {}
              temp.shift()
              if(temp.length > 1){
                tempGeo = cloneDeep({
                  type: 'Polygon',
                  coordinates: [temp]
                })
              }else{
                tempGeo = cloneDeep({
                  type: 'Point',
                  coordinates: temp[0]
                })
              }
              updata[pa] = tempGeo
              break
            case 'unset':
              updata[pa] = {}
              updata[pa]['$unset'] = ''
              break
            case 'incr':
              updata[pa] = {}
              updata[pa]['$incr_by'] = u[pa][1]
              break
            case 'append':
              updata[pa] = {}
              updata[pa]['$append'] = Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]]
              break
            case 'uAppend':
              updata[pa] = {}
              updata[pa]['$append_unique'] = Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]]
              break
            case 'remove':
              updata[pa] = {}
              updata[pa]['$remove'] = Array.isArray(u[pa][1]) ? u[pa][1] : [u[pa][1]]
              break
            case 'patchObject':
              updata[pa] = {}
              updata[pa]['$update'] = u[pa][1]
              break
            default:
              throw new Error(UPDATE_ERROR)
          }
        }else{
          //直接 set
          updata[pa] = u[pa]
        }
      }
      
      BaaS_F({
        method: 'put',
        url: `https://cloud.minapp.com/userve/v2.4/table/${table}/record/`,
        params: {
          where: QQ,
          limit: params.limit || 20,
          offset: (params.limit || 20) * ((params.page || 1) - 1),
          enable_trigger: params.enableTrigger === undefined ? true : params.enableTrigger,
          return_total_count: params.withCount ? 1 : 0,
        },
        data: updata
      }).then((res: any) => {
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

export default fetchUpdateOneMany