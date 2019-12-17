import React, { Component } from 'react';
import axios from 'axios';

class DeleteConferenceForm extends Component {
  constructor() {
    super();
    this.state = {
      title: '',
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
    await axios.delete(`/api/conf/${this.state.id}`);
    this.props.complete();
  }
  handleCancel() {
    this.props.cancel();
  }
  componentDidMount() {
    if (this.props.conf) {
      this.setState({
        title: `${this.props.conf.meeting_pin}: ${this.props.conf.description}`,
        id: this.props.conf.id,
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
        <h2>Delete Conference {this.state.title}</h2>
        <form onSubmit={this.handleSubmit}>
          <p>WARNING: This will delete all transcriptions (and recordings?) associated with this conference.</p>
          <button onClick={this.handleCancel}>Cancel</button>
          <button>Delete</button>
        </form>
      </div>
    );
  }
}

export default DeleteConferenceForm;
