import React, { PropTypes, Component } from 'react'
import { B, H, V, PAD, darkGray, red } from './bricks'

const inputStyle = {
  padding: '10px 8px',
  border: '1px solid #d6d6d6',
  borderRadius: 0,
  backgroundColor: '#fff',
  margin: 0,
  marginRight: '1%',
  height: '42px',
  flex: 1,
}

const btnStyle = {
  color: '#fff',
  padding: '9px 0',
  background: red,
  borderRadius: 0,
  cursor: 'pointer',
  border: 'none',
  textShadow: 'none',
  minWidth: '80px',
}

export default class NewsletterSignup extends Component {
  static propTypes = {
    tags: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  }
  static defaultProps = {
    tags: '125835',
    id: '129214',
  }
  state = {
    submitted: false,
    name: '',
    email: '',
  }
  getReqURI = () => {
   const info = {
      id: this.props.id,
      api_key: '0DZDEQZjU_laOYXzD6cQRA',
      name: this.state.name.trim(),
      email: this.state.email.trim(),
      tags: this.props.tags,
    }

    return Object.keys(info).reduce((prev, next, index) => {
      const and = index === 0 ? '' : '&'
      return prev + and + next + '=' + info[next]
    }, '')
  }
  handleSubmit = (e) => {
    e.preventDefault()

    if (!this.state.email) return

    let request = new XMLHttpRequest()
    request.open('POST', `//api.convertkit.com/v3/forms/129214/subscribe?${this.getReqURI()}`, true)
    request.onload = () => {
      if (request.status >= 200 && request.status < 400) {
        this.setState({email: '', name: '', submitted: true})
      }
    }
    request.send()
  }
  render () {
    return (
      <V background={darkGray}>
        <B background={darkGray} width="65%" margin="auto" color="white" padding={PAD*2+'px'} textAlign="center"fontSize="25px" fontWeight="bold">
          Sign up to receive updates about React Router, our workshops, online courses, and more.
        </B>
        <form onSubmit={this.handleSubmit}>
          {this.state.submitted === true
            ? <B color='white' textAlign='center'>Thank you for signing up.</B>
            : <H justifyContent="space-around" width="500px" margin="auto">
                <input style={inputStyle} value={this.state.name} onChange={(e) => this.setState({name: e.target.value})} type="text" name="name" placeholder="FIRST NAME" />
                <input style={inputStyle} value={this.state.email} onChange={(e) => this.setState({email: e.target.value})} type="email" name="email" placeholder="EMAIL ADDRESS" />
                <button style={btnStyle} type='submit'>
                  Subscribe
                </button>
              </H>}
        </form>
      </V>
    )
  }
}
