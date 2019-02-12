import createSagaCore from 'create-saga-core'
import { spawn, select, call, take, put } from 'redux-saga/effects'
import ClientService from './ClientService'
import CrystalService from './CrystalService'

const CoreAction = {
  FRAME_DIMENSIONS_UPDATED: 'FRAME_DIMENSIONS_UPDATED',
  FRAME_LAYER_UPDATED: 'FRAME_LAYER_UPDATED',
  SERVICE_URL_UPDATED: 'SERVICE_URL_UPDATED'
}

const ClientMessage = {
  DOWNLOAD_FRAME_IMAGE: 'DOWNLOAD_FRAME_IMAGE',
  UPDATE_FRAME_DIMENSIONS: 'UPDATE_FRAME_DIMENSIONS',
  UPDATE_FRAME_LAYER: 'UPDATE_FRAME_LAYER',
  UPDATE_FRAME_SCHEMA: 'UPDATE_FRAME_SCHEMA',
  UPDATE_SERVICE_URL: 'UPDATE_SERVICE_URL'
}

createSagaCore({ reducer, initializer })

function reducer(coreState = createInitialState(), coreAction) {
  switch (coreAction.type) {
    case CoreAction.FRAME_DIMENSIONS_UPDATED:
      return handleFrameDimensionsUpdated(coreState, coreAction.payload)
    case CoreAction.FRAME_LAYER_UPDATED:
      return handleFrameLayerUpdated(coreState, coreAction.payload)
    case CoreAction.SERVICE_URL_UPDATED:
      return handleServiceUrlUpdated(coreState, coreAction.payload)
    default:
      return coreState
  }
}

function createInitialState() {
  return {
    frameDimensions: {
      width: 644,
      height: 644
    },
    frameLayers: [],
    serviceUrl: 'http://localhost:3000'
  }
}

function handleFrameDimensionsUpdated(coreState, { frameDimensions }) {
  return { ...coreState, frameDimensions }
}

function handleFrameLayerUpdated(coreState, { layerIndex, frameLayer }) {
  const frameLayers = coreState.frameLayers.slice()
  if (frameLayer) {
    frameLayers.splice(layerIndex, 1, frameLayer)
  } else {
    frameLayers.splice(layerIndex, 1)
  }
  return { ...coreState, frameLayers }
}

function handleServiceUrlUpdated(coreState, { serviceUrl }) {
  return { ...coreState, serviceUrl }
}

function* initializer() {
  yield spawn(clientProcessor)
  yield spawn(mainWidgetHydrator)
  yield spawn(imageViewerHydrator)
}

function* clientProcessor() {
  const initialCoreState = yield select()
  const { clientMessageChannel } = yield call(
    ClientService.launch,
    initialCoreState
  )
  while (true) {
    const clientMessage = yield take(clientMessageChannel)
    switch (clientMessage.type) {
      case ClientMessage.DOWNLOAD_FRAME_IMAGE:
        yield call(handleDownloadFrameImage)
        continue
      case ClientMessage.UPDATE_FRAME_DIMENSIONS:
        yield call(handleUpdateFrameDimensions, clientMessage.payload)
        continue
      case ClientMessage.UPDATE_FRAME_LAYER:
        yield call(handleUpdateFrameLayer, clientMessage.payload)
        continue
      case ClientMessage.UPDATE_FRAME_SCHEMA:
        yield call(handleUpdateFrameSchema, clientMessage.payload)
        continue
      case ClientMessage.UPDATE_SERVICE_URL:
        yield call(handleUpdateServiceUrl, clientMessage.payload)
        continue
      default:
        throw Error(`Unrecognized client message: ${clientMessage.type}`)
    }
  }
}

function* handleDownloadFrameImage() {
  try {
    const { frameDimensions, frameLayers, serviceUrl } = yield select()
    yield call(ClientService.downloadFrameImage, {
      frameDimensions,
      frameLayers,
      serviceUrl
    })
  } catch {
    // handle error
  }
}

function* handleUpdateFrameDimensions({ nextFrameDimensions }) {
  yield put({
    type: CoreAction.FRAME_DIMENSIONS_UPDATED,
    payload: {
      frameDimensions: nextFrameDimensions
    }
  })
}

function* handleUpdateFrameLayer({ nextLayer, nextIndex }) {
  yield put({
    type: CoreAction.FRAME_LAYER_UPDATED,
    payload: {
      frameLayer: nextLayer,
      layerIndex: nextIndex
    }
  })
}

function* handleUpdateFrameSchema({ nextSchemaSource }) {
  try {
    const { serviceUrl } = yield select()
    yield call(CrystalService.loadFrameSchema, {
      serviceUrl,
      schemaSource: nextSchemaSource
    })
  } catch {
    // handle error
  }
}

function* handleUpdateServiceUrl({ nextServiceUrl }) {
  yield put({
    type: CoreAction.SERVICE_URL_UPDATED,
    payload: {
      serviceUrl: nextServiceUrl
    }
  })
}

function* mainWidgetHydrator() {
  while (true) {
    const allCoreActions = Object.keys(CoreAction)
    yield take(allCoreActions)
    const coreState = yield select()
    yield call(ClientService.hydrateMainWidget, coreState)
  }
}

function* imageViewerHydrator() {
  while (true) {
    yield take([CoreAction.FRAME_LAYER_UPDATED])
    try {
      const { frameDimensions, frameLayers, serviceUrl } = yield select()
      yield call(ClientService.hydrateImageViewer, {
        frameDimensions,
        frameLayers,
        serviceUrl
      })
    } catch {
      // handle error
    }
  }
}
