import React from 'react';
import {render} from 'react-dom';
import {StoreContext} from 'redux-react-hook';
import * as serviceWorker from '../../serviceWorker';
import App from '../../app';
import withSentry from '../../sentry';
import StorageService from '../../services/storage-service';
import store from '../../store';
import './style.less';

async function launch() {
  const savedData = await StorageService.get();
  store.dispatch({type: 'RECEIVE_DATA', ...savedData});
  store.subscribe(() => {
    const state = store.getState();
    StorageService.set(state);
  });

  const Root = withSentry(() => (
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>
  ));

  render(
    <Root />,
    document.querySelector('#root')
  );
}

launch();

serviceWorker.unregister();
