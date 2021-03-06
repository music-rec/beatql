import React from 'react';
import { map } from 'lodash';

import { MUTATION_CREATE_INSTRUMENT, MUTATION_DELETE_SEQUENCER } from '../../api/mutations';
import { SUBSCRIPTION_INSTRUMENT_ADDED, SUBSCRIPTION_SEQUENCER_UPDATED, SUBSCRIPTION_SEQUENCER_DELETED } from '../../api/subscriptions';
import Instrument from '../Instrument';
import { addInstrumentToSong, updateSequencerInSong, deleteSequencerFromSong } from '../../reducers';
import { withMutations } from '../../util/mutations';

class Sequencer extends React.Component {
  constructor(props) {
    super(props);

    this.subscriptionObserverInstrumentAdded = null;
    this.subscriptionObserverSequencerUpdated = null;
    this.subscriptionObserverSequencerDeleted = null;
    this.subscriptionSequencerId = null;
  }

  subscribe(sequencerId, updateQuery) {
    this.subscriptionSequencerId = sequencerId;

    this.subscriptionObserverInstrumentAdded = this.props.client.subscribe({
      query: SUBSCRIPTION_INSTRUMENT_ADDED,
      variables: { sequencerId },
    }).subscribe({
      next(data) { updateQuery(prev => addInstrumentToSong(prev, data.instrumentAdded)) },
      error(err) { err.forEach(e => console.error(e)) },
    });

    this.subscriptionObserverSequencerUpdated = this.props.client.subscribe({
      query: SUBSCRIPTION_SEQUENCER_UPDATED,
      variables: { sequencerId },
    }).subscribe({
      next(data) { updateQuery(prev => updateSequencerInSong(prev, data.sequencerUpdated)) },
      error(err) { err.forEach(e => console.error(e)) },
    });

    this.subscriptionObserverSequencerDeleted = this.props.client.subscribe({
      query: SUBSCRIPTION_SEQUENCER_DELETED,
      variables: { sequencerId },
    }).subscribe({
      next(data) { updateQuery(prev => deleteSequencerFromSong(prev, data.sequencerDeleted)) },
      error(err) { err.forEach(e => console.error(e)) },
    });
  }

  unsubscribe() {
    if (this.subscriptionObserverInstrumentAdded) {
      this.subscriptionObserverInstrumentAdded.unsubscribe();
    }
    if (this.subscriptionObserverSequencerUpdated) {
      this.subscriptionObserverSequencerUpdated.unsubscribe();
    }
    if (this.subscriptionObserverSequencerDeleted) {
      this.subscriptionObserverSequencerDeleted.unsubscribe();
    }
  }

  componentDidMount() {
    this.subscribe(this.props.sequencer.id, this.props.updateQuery);
  }

  componentWillReceiveProps(nextProps) {
    if (this.subscriptionSequencerId !== nextProps.sequencer.id) {
      this.unsubscribe();
      this.subscribe(nextProps.sequencer.id, nextProps.updateQuery);
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  render() {
    const { sequencer } = this.props;

    return (
      <div>
        <h3>Sequencer <small>{sequencer.id}</small></h3>
        <div>
          <dt>Bars:</dt>
          <dd>{sequencer.bars}</dd>
          <dt>Resolution:</dt>
          <dd>{sequencer.resolution}</dd>
        </div>

        <h4>Instruments:</h4>
        <div className="well">
          {map(sequencer.instruments, instrument => <Instrument client={this.props.client} instrument={instrument} key={instrument.id} updateQuery={this.props.updateQuery} />)}
        </div>

        <div className="btn-toolbar">
          <div className="btn-group">
            <button className="btn btn-success" onClick={this.handleCreateInstrument.bind(this, 'Sampler')}>Create Sampler</button>
            <button className="btn btn-success" onClick={this.handleCreateInstrument.bind(this, 'Synth')}>Create Synth</button>
          </div>
          <div className="btn-group">
            <button className="btn btn-danger" onClick={this.handleDelete.bind(this)}>Delete Sequencer</button>
          </div>
        </div>
        <hr />
      </div>
    );
  }

  handleCreateInstrument(instrumentType) {
    this.props.createInstrument(this.props.sequencer.id, instrumentType, {});
  }

  handleDelete() {
    this.props.deleteSequencer(this.props.sequencer.id);
  }
}

const SequencerWithMutations = withMutations(Sequencer, {
  createInstrument: {
    gql: MUTATION_CREATE_INSTRUMENT,
    prop: (mutate, sequencerId, instrumentType, data) => mutate({
      variables: { sequencerId, instrumentType, data },
      updateQueries: {
        song: (prev, { mutationResult }) => {
          return addInstrumentToSong(prev, mutationResult.data.createInstrument);
        },
      },
    }),
  },
  deleteSequencer: {
    gql: MUTATION_DELETE_SEQUENCER,
    prop: (mutate, sequencerId) => mutate({
      variables: { sequencerId },
      updateQueries: {
        song: (prev, { mutationResult }) => {
          return deleteSequencerFromSong(prev, mutationResult.data.deleteSequencer);
        },
      },
    }),
  },
});

export default SequencerWithMutations;
