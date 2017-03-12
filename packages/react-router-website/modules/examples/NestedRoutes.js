import React from 'react'
import {
  BrowserRouter as Router,
  Route,
  Link,
  Switch
} from 'react-router-dom'

const ALBUMS = [
  { id: 'album-1', title: 'Sports', photos: [ 'photo-1', 'photo-2' ] },
  { id: 'album-2', title: 'Family', photos: [ 'photo-3', 'photo-4' ] },
  { id: 'album-3', title: 'Friends', photos: [ 'photo-5' ] }
];

const PHOTOS = [
  { id: 'photo-1', caption: 'Running around fast' },
  { id: 'photo-2', caption: 'At the gym' },
  { id: 'photo-3', caption: 'My dogs' },
  { id: 'photo-4', caption: 'Me and my wife' },
  { id: 'photo-5', caption: 'Just hanging around' }
]

const NestedRoutes = () => (
  <Router>
    <div>
      <h1>Photo Albums</h1>
      <ul>
        {ALBUMS.map(album => (
          <li key={album.id}>
            <Link to={`/albums/${album.id}`}>{album.title}</Link>
          </li>
        ))}
      </ul>

      <Route path="/albums/:albumId" component={PhotoAlbum} />
    </div>
  </Router>
)

const PhotoAlbum = ({ match }) => {
  const album = ALBUMS.find(album => album.id === match.params.albumId)
  return (
    <div>
      <h2>Album: {album.title}</h2>
      <ul>
        {album.photos.map(photoId => {
          const photo = PHOTOS.find(photo => photoId === photo.id)
          return (
            <li key={photoId}>
              <Link to={`${match.url}/photos/${photo.id}`}>{photo.caption}</Link>
            </li>
          )
        })}
      </ul>

      <Route path={`${match.path}/photos/:photoId`} component={Photo} />
    </div>
  )
}

const Photo = ({ match }) => {
  const photo = PHOTOS.find(photo => photo.id === match.params.photoId)
  const album = ALBUMS.find(album => album.id === match.params.albumId)
  return (
    <div>
      <h3>Photo: {photo.caption}</h3>
      <p>This photo is in: <strong>{album.title}</strong></p>
    </div>
  )
}

export default NestedRoutes
