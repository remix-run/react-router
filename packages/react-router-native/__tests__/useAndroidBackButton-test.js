import {
  useAndroidBackButton,
  useHardwareBackButton
} from 'react-router-native';

describe('useAndroidBackButton', () => {
  it('is an re-export of useHardwareBackButton', () => {
    expect(useAndroidBackButton).toEqual(useHardwareBackButton);
  });
});
