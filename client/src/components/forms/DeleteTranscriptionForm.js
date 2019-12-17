import React, { Component } from 'react';
import axios from 'axios';

class DeleteTranscriptionForm extends Component {
  constructor() {
    super();
    this.state = {
      id: null,
      errorMessage: '',
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }
  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });
  }
  async handleSubmit(e) {
    e.preventDefault();
    await axios.delete(`/api/trans/${this.state.id}`);
    this.props.complete();
  }
  handleCancel() {
    this.props.cancel();
  }
  componentDidMount() {
    this.setState({
      id: this.props.transcription.id,
    })
  }
  render() {
    return (
      <div>
        <h2>Delete Transcription</h2>
        <form onSubmit={this.handleSubmit}>
          <p>From Conference: {this.props.conference.meeting_pin}: {this.props.conference.description}</p>
          <p>Transcription start time: {this.props.transcription.time_start}</p>
          <p>Transcription end time: {this.props.transcription.time_end || '[Still in progress]'}</p>
          <p>WARNING: This will delete the transcription (and recordings?).</p>
          <button onClick={this.handleCancel}>Cancel</button>
          <button>Delete</button>
        </form>
      </div>
    );
  }
}

export default DeleteTranscriptionForm;
