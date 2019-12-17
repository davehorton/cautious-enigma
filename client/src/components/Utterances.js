import React, { Component } from 'react';
import axios from 'axios';
import { datetime, timeDifference } from '../util/date-format';

class Utterances extends Component {
  constructor() {
    super();
    this.state = {
      confInfo: {},
      transInfo: {},
      utterances: [],
    }
  }
  async componentDidMount() {
    const confId = this.props.match.params.confId;
    const transId = this.props.match.params.transId;

    const confInfo = await axios.get(`/api/conf/${confId}`);
    this.setState({ confInfo: confInfo.data });

    const transInfo = await axios.get(`/api/trans/${transId}`);
    this.setState({ transInfo: transInfo.data });

    const utterances = await axios.get(`/api/trans/${transId}/utter`);
    this.setState({ utterances: utterances.data });
  }
  render() {
    return (
      <div>
        <a href={`/conf/${this.props.match.params.confId}`}>
          &lt; Back to Transcriptions
        </a>
        <h1>
          Conference
          {' '}
          {this.state.confInfo.meeting_pin}:
          {' '}
          {this.state.confInfo.description}
        </h1>
        <h2>Transcription Info</h2>
        <table>
          <tbody>
            <tr>
              <td>Start Time:</td>
              <td>{datetime(this.state.transInfo.time_start)}</td>
            </tr>
            <tr>
              <td>End Time:</td>
              <td>
                {
                  this.state.transInfo.time_end
                    ? datetime(this.state.transInfo.time_end)
                    : 'Currently in progress'
                }
              </td>
            </tr>
            {
              this.state.transInfo.time_end
                ? <tr>
                    <td>Duration:</td>
                    <td>
                      {
                        timeDifference(
                          this.state.transInfo.time_start,
                          this.state.transInfo.time_end
                        )
                      }
                    </td>
                  </tr>
                : null
            }
          </tbody>
        </table>
        <audio controls></audio>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Speech</th>
              <th>Duration</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {
              this.state.utterances.map(u => (
                <tr key={u.seq}>
                  <td>{u.start || ''}</td>
                  <td>{u.speech}</td>
                  <td>{u.duration}</td>
                  <td>{u.confidence}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    );
  }
}

export default Utterances;
