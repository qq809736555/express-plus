import ky from 'ky';
import pMap from 'p-map';
import StorageService from './StorageService';
import FavoriteModel from '../model/FavoriteModel';

// TODO 把代码映射放到独立文件
export const comCodeMap = {
  shunfeng: '顺丰',
  zhaijisong: '宅急送',
  zhongtong: '中通',
  yuantong: '圆通',
  yunda: '韵达',
  shentong: '申通',
  tiantian: '天天',
  quanfengkuaidi: '全峰快递',
  debangwuliu: '德邦物流',
  jd: '京东物流',
  ems: 'EMS',
  emsen: 'EMS(EN)',
  emsguoji: 'EMS国际',
  youzhengguoji: '邮政国际',
  youzhengguonei: '邮政国内',
  usp: 'USP',
  usps: 'USPS',
  dhlde: 'DHL(DE)',
  dhlen: 'DHL(EN)',
  dhl: 'DHL',
  ecmsglobal: 'ECMS',
  ecmscn: '易客满',
  wanxiangwuliu: '万象物流',
  xinbangwuliu: '新邦物流',
  rufengda: '如风达',
  baishiwuliu: '百世快运',
  youshuwuliu: '优速快递',
};

// 状态码
export const stateMap = {
  0: '在途中', // In transit
  1: '已揽收', // Accepted
  2: '疑难',
  3: '已签收', // Delivered
  4: '退签',
  5: '同城派送中',
  6: '退回',
  7: '转单',
};

export const STATE_IN_TRANSIT = '0';
export const STATE_ACCEPTED = '1';
export const STATE_DELIVERED = '3';

// API 结果
export const statusMap = {
  200: 'ok',
  604: '非法访问:IP禁止访问',
};

const api = ky.extend({
  prefixUrl: 'https://www.kuaidi100.com',
});

let updating = false;

// 所有跟快递服务器相关的处理
export default class KuaidiService {
  static getCompanyName(comCode) {
    return comCodeMap[comCode] || comCode;
  }

  static getStateLabel(state) {
    return stateMap[state] || state;
  }

  /**
   * 自动识别
   * @number 快递单号
   * @return 数组，返回可能的快递类型
   */
  static async auto(number) {
    const data = await api
      .get('autonumber/autoComNum', {
        searchParams: {
          resultv2: 1,
          text: number,
        },
      })
      .json();

    return data.autoDest || data.auto || [];
  }

  /**
   * 查询快递
   * @postid 快递单号
   * @type 快递类型
   * @return FavoriteModel
   */
  static async query(postid, type) {
    const data = await api
      .get('query', {
        searchParams: {
          type,
          postid,
          temp: Math.random(),
        },
      })
      .json()
      .then(json => FavoriteModel.fromJson(json));
    return data;
  }

  // TODO 改为订阅形式，比如传入个callback或者可订阅快递的更新事件
  static async update() {
    if (updating) return [];
    updating = true;
    const favorites = await StorageService.getQueryFavorites();
    if (favorites && favorites.length) {
      // -
      let messages = await pMap(
        favorites,
        async ({postId, type, lastestData, tags}) => {
          try {
            const result = await KuaidiService.query(postId, type);
            if (
              result.data.length &&
              result.data[0].time !== lastestData.time
            ) {
              const nextFavorite = FavoriteModel.fromObject(result);
              nextFavorite.tags = tags;
              // 更新已保存的快递
              await StorageService.updateFavorite(nextFavorite);
              return nextFavorite;
            }
            return null;
          } catch (_) {
            return null;
          }
        },
        {concurrency: 1}
      );

      messages = messages.filter(msg => msg !== null);

      // 是否开启过滤未签收快递
      if (await StorageService.shouldFilterChecked()) {
        messages = messages.filter(msg => msg.state === '3');
      }

      updating = false;
      return messages;
    }

    updating = false;
    return [];
  }
}
