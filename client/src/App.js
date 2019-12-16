import React from 'react';
import { Switch, Route, NavLink } from 'react-router-dom';
import Conferences from './components/Conferences';
import Transcriptions from './components/Transcriptions';
import Utterances from './components/Utterances';

function App() {
  return (
    <div className="App">
      <nav>
        <NavLink exact to='/'>Home</NavLink>
      </nav>
      <Switch>
        <Route exact path='/'          component={Conferences} />
        <Route exact path='/conf/:id'  component={Transcriptions} />
        <Route exact path='/trans/:id' component={Utterances} />
      </Switch>
    </div>
  );
}

export default App;
