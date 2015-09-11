let meetups = [];
const cache = [];

function findMeetup(id) {
  return function(element) {
    return element.urlname === id;
  };
}

export function getMeetups() {
  return meetups;
}

export function setMeetups(data) {
  meetups = data;
  return meetups;
}

export function getMeetup(id) {
  return meetups.find(findMeetup(id)) || cache.find(findMeetup(id)) || false;
}

export function cacheMeetup(data) {
  if (!cache.find(findMeetup(data.urlname))) {
    cache.push(data);
  }
  return data;
}
