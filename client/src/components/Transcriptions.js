import React, { Component } from 'react';
import axios from 'axios';
import DeleteTranscriptionForm from './forms/DeleteTranscriptionForm';
import { datetime, timeOnly, isSameDate } from '../util/date-format';

class Transcriptions extends Component {
  constructor() {
    super();
    this.state = {
      confInfo: {},
      transcriptions: [],
      modalDisplayed: '',
      transcriptionBeingModified: null,
    }
    this.cancelForm = this.cancelForm.bind(this);
    this.refreshAfterSave = this.refreshAfterSave.bind(this);
    this.sortReverse = this.sortReverse.bind(this);
  }
  toggleTransMenu(id) {
    this.setState(state => ({
      transcriptions: state.transcriptions.map(t => {
        if (t.id === id) {
          return {
            ...t,
            showMenu: !t.showMenu,
          }
        } else {
          return {
            ...t,
            showMenu: false,
          }
        }
      })
    }));
  }
  deleteTranscription(trans) {
    this.setState(state => ({
      modalDisplayed: 'deleteTranscription',
      transcriptionBeingModified: trans,
      transcriptions: state.transcriptions.map(t => ({
        ...t,
        showMenu: false,
      }))
    }));
  }
  cancelForm() {
    this.setState({
      modalDisplayed: '',
      transcriptionBeingModified: null,
    })
  }
  async refreshAfterSave() {
    const confId = this.props.match.params.id;
    const transcriptions = await axios.get(`/api/conf/${confId}/trans`)
    this.setState({
      transcriptions: transcriptions.data,
      modalDisplayed: '',
      transcriptionBeingModified: null,
    })
  }
  sortReverse() {
    const transcriptions = this.state.transcriptions;
    const reversed = [];
    for (let i = transcriptions.length - 1; i >= 0; i--) {
      reversed.push(transcriptions[i])
    }
    this.setState({
      transcriptions: reversed,
    })
  }
  async componentDidMount() {
    const confId = this.props.match.params.id;
    const confInfo = await axios.get(`/api/conf/${confId}`);
    const transcriptions = await axios.get(`/api/conf/${confId}/trans`)
    this.setState({
      confInfo: confInfo.data,
      transcriptions: transcriptions.data,
    });
  }
  render() {
    return (
      <div>
        <a href='/'>&lt; Back to Conferences</a>
        {
          this.state.modalDisplayed === 'deleteTranscription'
            ? <DeleteTranscriptionForm
                transcription={this.state.transcriptionBeingModified}
                conference={this.state.confInfo}
                cancel={this.cancelForm}
                complete={this.refreshAfterSave}
              />
            : null
        }
        <h1>
          Conference
          {' '}
          {this.state.confInfo.meeting_pin}:
          {' '}
          {this.state.confInfo.description}
        </h1>
        <h2>Transcriptions</h2>
        <form>
          <label htmlFor="sort">Sort</label>
          <select name="sort" onChange={this.sortReverse}>
            <option value="newestFirst">Newest First</option>
            <option value="oldestFirst">Oldest First</option>
          </select>
        </form>
        <table>
          <thead>
            <tr>
              <th>Start Time</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.transcriptions.map(t => (
                <tr key={t.id}>
                  {
                    isSameDate(t.time_start, t.time_end)
                      ? <React.Fragment>
                          <td>
                            <a href={`/conf/${this.props.match.params.id}/trans/${t.id}`}>
                              {datetime(t.time_start)}
                            </a>
                          </td>
                          <td>
                            <a href={`/conf/${this.props.match.params.id}/trans/${t.id}`}>
                              {
                                t.time_end
                                  ? timeOnly(t.time_end)
                                  : 'In progress'
                              }
                            </a>
                          </td>
                        </React.Fragment>
                      : <React.Fragment>
                          <td>
                            <a href={`/conf/${this.props.match.params.id}/trans/${t.id}`}>
                             {datetime(t.time_start)}
                            </a>
                          </td>
                          <td>
                            <a href={`/conf/${this.props.match.params.id}/trans/${t.id}`}>
                              {
                                t.time_end
                                  ? datetime(t.time_end)
                                  : 'In progress'
                              }
                            </a>
                          </td>
                        </React.Fragment>
                  }
                  <td>

                  </td>
                  <td>
                    <button
                      onClick={this.toggleTransMenu.bind(this, t.id)}
                      disabled={this.state.modalDisplayed}
                    >
                      &#9776;
                    </button>
                    {
                      t.showMenu
                        ? <div>
                            <a href={`/conf/${this.props.match.params.id}/trans/${t.id}`}>
                              View transcription
                            </a>
                            <button
                              onClick={this.deleteTranscription.bind(this, t)}
                              disabled={this.state.modalDisplayed}
                            >
                              Delete Transcription
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

export default Transcriptions;
