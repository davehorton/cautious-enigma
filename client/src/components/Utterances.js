import React, { Component } from 'react';
import axios from 'axios';
import { datetime, timeOnly, timeWithSeconds, dateOnly, timeDifference, isSameDate, formatTimeDuration, getTimeOffset } from '../util/date-format';
import Main from '../styles/Main';
import H1 from '../styles/H1';
import A from '../styles/A';
import Table from '../styles/Table';
import Audio from '../styles/Audio';
import DescriptiveTable from '../styles/DescriptiveTable';
import styled from 'styled-components';

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 1rem;
  @media (max-width: 700px) {
    padding: 0.5rem;
  }
`;

const UtterTable = {};
UtterTable.Table = styled(Table.Table)`
  width: 100%;
  margin: 0;
  table-layout: auto;
`;
UtterTable.DateLineTr = styled.tr``;
UtterTable.TheadTr = styled.tr`
  background: #333;
  @media (max-width: 700px) {
    display: flex;
    justify-content: space-between;
  }
`;
UtterTable.Tr = styled.tr`
  position: relative;
  border-top: 1px solid #ccc;
  ${UtterTable.DateLineTr} + & {
    border-top: none;
  }
  @media (max-width: 700px) {
    display: flex;
    flex-direction: column;
  }
`;
UtterTable.Th = styled(Table.Th)`
  color: #fff;
  &:first-child,
  &:last-child {
    width: unset;
  }
`;
UtterTable.Td = styled(Table.Td)`
  padding: 0.5rem;
  &:first-child {
    color: #777;
  }
  &:nth-child(3),
  &:nth-child(4) {
    text-align: right
    color: #777;
  }
  @media (max-width: 700px) {
    &:first-child {
      padding-bottom: 0;
    }
    &:nth-child(2) {
      padding-bottom: 1rem;
    }
    &:nth-child(3) {
      position: absolute;
      top: 0;
      right: 4rem;
    }
    &:nth-child(4) {
      position: absolute;
      top: 0;
      right: 0;
    }
  }
`;
UtterTable.NoResultsTd = styled.td`
  padding: 4rem;
  text-align: center;
`;
UtterTable.DateLineTd = styled(UtterTable.Td)`
  text-align: center;
  padding: 0.5rem 0;
  color: #777;
  &:after {
    content: '';
    box-sizing: border-box;
    border-left: 0.5rem solid #fff;
    border-right: 0.5rem solid #fff;
    width: 100%;
    height: 1px;
    background: #aaa;
    position: absolute;
    top: 49%;
    left: 0;
    z-index: -1;
  }
`;
UtterTable.DateLineDate = styled.span`
  padding: 0.5rem;
  background: #fff;
`;

class Utterances extends Component {
  constructor() {
    super();
    this.state = {
      confInfo: {},
      transInfo: {},
      utterances: [],
    };
    this.shouldDisplayDate = this.shouldDisplayDate.bind(this);
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

  shouldDisplayDate(u) {
    const time_start = this.state.transInfo.time_start;
    const utterances = this.state.utterances;
    if (!u) return false;
    const dateOfCurrentItem = getTimeOffset(
      time_start,
      u.start,
    );
    const prevUtterance = utterances.filter(ut => ut.seq === u.seq - 1)
    if (!prevUtterance[0]) return;
    const dateOfPreviousItem = getTimeOffset(
      time_start,
      prevUtterance[0] && prevUtterance[0].start,
    );

    return isSameDate(dateOfPreviousItem,dateOfCurrentItem)
      ? false
      : true
  }

  render() {
    return (
      <Main noPadding>
        <Header>
          <div>
            <A href={`/conf/${this.props.match.params.confId}`}>
              &lt; Back to Conference {this.state.confInfo.meeting_pin}
            </A>
            <H1>Transcription</H1>
          </div>
          <DescriptiveTable.Table>
            <tbody>
              <tr>
                <DescriptiveTable.LightTd>Conference:</DescriptiveTable.LightTd>
                <td>
                  {this.state.confInfo.meeting_pin}:
                  {' '}
                  {this.state.confInfo.description}
                </td>
              </tr>
              <tr>
                <DescriptiveTable.LightTd>Start Time:</DescriptiveTable.LightTd>
                <td>{datetime(this.state.transInfo.time_start)}</td>
              </tr>
              <tr>
                <DescriptiveTable.LightTd>End Time:</DescriptiveTable.LightTd>
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
                      <DescriptiveTable.LightTd>Duration:</DescriptiveTable.LightTd>
                      <td>
                        {
                          formatTimeDuration(timeDifference(
                            this.state.transInfo.time_start,
                            this.state.transInfo.time_end
                          ))
                        }
                      </td>
                    </tr>
                  : null
              }
            </tbody>
          </DescriptiveTable.Table>
        </Header>
        <Audio controls></Audio>
        <UtterTable.Table>
          <thead>
            <UtterTable.TheadTr>
              <UtterTable.Th>Time</UtterTable.Th>
              <UtterTable.Th>Speech</UtterTable.Th>
              <UtterTable.Th>Duration</UtterTable.Th>
              <UtterTable.Th>Confidence</UtterTable.Th>
            </UtterTable.TheadTr>
          </thead>
          <tbody>
            <UtterTable.DateLineTr>
              <UtterTable.DateLineTd colSpan="4">
                <UtterTable.DateLineDate>
                  Started {dateOnly(this.state.transInfo.time_start)} at {timeOnly(this.state.transInfo.time_start)}
                </UtterTable.DateLineDate>
              </UtterTable.DateLineTd>
            </UtterTable.DateLineTr>
            {
              this.state.utterances.length
                ? null
                : <tr>
                    <UtterTable.NoResultsTd colSpan="4" noResults>
                      There were no utterances during this transcription
                    </UtterTable.NoResultsTd>
                  </tr>
            }
            {
              this.state.utterances.map(u => (
                <React.Fragment key={u.seq}>
                  {
                    this.shouldDisplayDate(u)
                      ? <UtterTable.DateLineTr>
                          <UtterTable.DateLineTd colSpan="4">
                            <UtterTable.DateLineDate>
                              {dateOnly(getTimeOffset(this.state.transInfo.time_start, u.start))}
                            </UtterTable.DateLineDate>
                          </UtterTable.DateLineTd>
                        </UtterTable.DateLineTr>
                      : null
                  }
                  <UtterTable.Tr>
                    <UtterTable.Td>
                      {
                        timeWithSeconds(getTimeOffset(
                          this.state.transInfo.time_start, u.start
                        )) || ''
                      }
                    </UtterTable.Td>
                    <UtterTable.Td>{u.speech}</UtterTable.Td>
                    <UtterTable.Td>{formatTimeDuration(u.duration)}</UtterTable.Td>
                    <UtterTable.Td>{u.confidence}</UtterTable.Td>
                  </UtterTable.Tr>
                </React.Fragment>
              ))
            }
            <UtterTable.DateLineTr>
              <UtterTable.DateLineTd colSpan="4">
                <UtterTable.DateLineDate>
                  {
                    this.state.transInfo.time_end
                      ? `Ended ${dateOnly(this.state.transInfo.time_end)} at ${timeOnly(this.state.transInfo.time_end)}`
                      : 'Conference is still in progress'}
                </UtterTable.DateLineDate>
              </UtterTable.DateLineTd>
            </UtterTable.DateLineTr>
          </tbody>
        </UtterTable.Table>
      </Main>
    );
  }
}

export default Utterances;