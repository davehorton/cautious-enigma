import React, { Component } from 'react';
import axios from 'axios';

class AddEditConferenceForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      id: null,
      meeting_pin: '',
      description: '',
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
    const requestBody = {
      'meeting-pin': this.state.meeting_pin,
      'description': this.state.description,
    };
    if (this.state.id) {
      await axios.put(`/api/conf/${this.state.id}`, requestBody);
    } else {
      await axios.post(`/api/conf`, requestBody);
    }
    this.props.complete();
  }
  handleCancel() {
    this.props.cancel();
  }
  componentDidMount() {
    if (this.props.conf) {
      this.setState({
        title: 'Edit Conference',
        id: this.props.conf.id,
        meeting_pin: this.props.conf.meeting_pin || '',
        description: this.props.conf.description || '',
      })
    } else {
      this.setState({
        title: 'Add Conference',
      })
    }
  }
  render() {
    return (
      <div>
        <h2>{this.state.title}</h2>
        <form onSubmit={this.handleSubmit}>
          <label htmlFor="meeting_pin">Meeting PIN</label>
          <input
            id="meeting_pin"
            name="meeting_pin"
            type="text"
            value={this.state.meeting_pin}
            onChange={this.handleChange}
          />
          <label htmlFor="description">Description</label>
          <input
            id="description"
            name="description"
            type="text"
            value={this.state.description}
            onChange={this.handleChange}
          />
          <button
            type="button"
            onClick={this.handleCancel}
          >
            Cancel
          </button>
          <button>Save</button>
        </form>
      </div>
    );
  }
}

export default AddEditConferenceForm;
