/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useState} from 'react';
import {Icon, Input, Tooltip, AutoComplete, Dropdown, Menu} from 'antd';
import {Link} from 'react-router-dom';
import KuaidiService from '@/services/KuaidiService';

const menu = (
  <Menu>
    <Menu.Item key='0'>
      <Link to='/'>
        <Icon type='inbox' /> 收藏列表
      </Link>
    </Menu.Item>
    <Menu.Item key='1'>
      <Link to='/settings'>
        <Icon type='setting' /> 设置
      </Link>
    </Menu.Item>
    <Menu.Item key='2'>
      <a
        href='https://github.com/minosss/express-plus/issues'
        target='_blank'
        rel='noopener noreferrer'
      >
        <Icon type='github' /> 去 Github 报错
      </a>
    </Menu.Item>
  </Menu>
);

function renderOption(item, _) {
  return (
    <AutoComplete.Option
      key={`${item.postId}-${item.comCode}`}
      text={item.postId}
    >
      <Link to={`/detail/${item.postId}/${item.comCode}`}>
        <div className='auto-option'>
          <div className='auto-postid'>{item.postId}</div>
          <div className='auto-type'>
            {KuaidiService.getCompanyName(item.comCode)}
          </div>
        </div>
      </Link>
    </AutoComplete.Option>
  );
}

// TODO 将历史和识别选项分组
export default function AppHeader() {
  const [dataSource, setDataSrouce] = useState([]);

  const handleSearch = async value => {
    if (String(value).length < 6) return;
    let data = await KuaidiService.auto(value);
    data =
      data && data.length ? data.map(item => ({...item, postId: value})) : [];
    setDataSrouce(data);
  };

  const handleSelect = item => {
    console.log(item);
    // jump to detial
  };

  return (
    <div className='app-header'>
      <div className='start'>
        <Link to='/' style={{color: 'inherit'}}>
          Express+
        </Link>
      </div>
      <div className='end'>
        <AutoComplete
          dataSource={dataSource.map(renderOption)}
          onSearch={handleSearch}
          onSelect={handleSelect}
          optionLabelProp='text'
        >
          <Input placeholder='输入快递单号' prefix={<Icon type='search' />} />
        </AutoComplete>
        <Tooltip title='菜单'>
          <Dropdown overlay={menu} trigger={['click']}>
            <a href='#' className='action'>
              <Icon type='menu' />
            </a>
          </Dropdown>
        </Tooltip>
      </div>
    </div>
  );
}
