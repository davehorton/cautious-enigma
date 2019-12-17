import React, { Component } from 'react';
import axios from 'axios';
import AddEditConferenceForm from './forms/AddEditConferenceForm';
import DeleteConferenceForm from './forms/DeleteConferenceForm';

class Conferences extends Component {
  constructor() {
    super();
    this.state = {
      conferences: [],
      modalDisplayed: '',
      confBeingModified: null,
    };
    this.addConference = this.addConference.bind(this);
    this.cancelForm = this.cancelForm.bind(this);
    this.refreshAfterSave = this.refreshAfterSave.bind(this);
  }
  toggleConfMenu(id) {
    this.setState(state => ({
      conferences: state.conferences.map(c => {
        if (c.id === id) {
          return {
            ...c,
            showMenu: !c.showMenu,
          }
        } else {
          return {
            ...c,
            showMenu: false,
          }
        }
      })
    }));
  }
  addConference() {
    const confWithClosedMenus = this.state.conferences.map(c => ({
      ...c,
      showMenu: false,
    }))
    this.setState({
      modalDisplayed: 'addEditConference',
      conferences: confWithClosedMenus,
      confBeingModified: null,
    })
  }
  editConference(conf) {
    const confWithClosedMenus = this.state.conferences.map(c => ({
      ...c,
      showMenu: false,
    }))
    this.setState({
      modalDisplayed: 'addEditConference',
      conferences: confWithClosedMenus,
      confBeingModified: conf,
    });
  }
  deleteConference(conf) {
    const confWithClosedMenus = this.state.conferences.map(c => ({
      ...c,
      showMenu: false,
    }))
    this.setState({
      modalDisplayed: 'deleteConference',
      conferences: confWithClosedMenus,
      confBeingModified: conf,
    });
  }
  cancelForm() {
    this.setState({
      modalDisplayed: '',
      confBeingModified: null,
    })
  }
  async refreshAfterSave() {
    const conferencesResults = await axios.get('/api/conf');
    this.setState({
      conferences: conferencesResults.data,
      modalDisplayed: '',
      confBeingModified: null,
    })
  }
  async componentDidMount() {
    const conferencesResults = await axios.get('/api/conf');
    this.setState({ conferences: conferencesResults.data });
  }
  render() {
    return (
      <div>
        {
          this.state.modalDisplayed === 'addEditConference'
            ? <AddEditConferenceForm
                conf={this.state.confBeingModified}
                cancel={this.cancelForm}
                complete={this.refreshAfterSave}
              />
            : null
        }
        {
          this.state.modalDisplayed === 'deleteConference'
            ? <DeleteConferenceForm
                conf={this.state.confBeingModified}
                cancel={this.cancelForm}
                complete={this.refreshAfterSave}
              />
            : null
        }
        <h1>Conferences</h1>
        <button
          onClick={this.addConference}
          disabled={this.state.modalDisplayed}
        >
          Add a conference
        </button>
        <table>
          <thead>
            <tr>
              <th>Pin</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.conferences.map(c => (
                <tr key={c.id}>
                  <td><a href={`/conf/${c.id}`}>{c.meeting_pin}</a></td>
                  <td>
                    <a href={`/conf/${c.id}`}>
                      {c.description}
                    </a>
                    <span title="There is currently an active call on this conference">
                      {c.freeswitch_ip && '(Active)'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={this.toggleConfMenu.bind(this, c.id)}
                      disabled={this.state.modalDisplayed}
                    >
                      &#9776;
                    </button>
                    {
                      c.showMenu
                        ? <div>
                            <a href={`/conf/${c.id}`}>View Transcriptions</a>
                            <button
                              onClick={this.editConference.bind(this, c)}
                              disabled={this.state.modalDisplayed}
                            >
                              Edit Conference
                            </button>
                            <button
                              onClick={this.deleteConference.bind(this, c)}
                              disabled={this.state.modalDisplayed}
                            >
                              Delete Conference
                            </button>
                          </div>
                        : null
                    }
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }
}

export default Conferences;
