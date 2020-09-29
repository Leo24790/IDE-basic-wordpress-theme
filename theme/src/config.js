module.exports = [
  {
    name: 'main',
    deps: [
      '~jquery/dist/jquery.min',
      'vendor/my-lib'
    ],
    files: [
      'components/foo',
      'components/bar'
    ]
  }
]

// Add more JS files to export with following syntax
// ~ references node-modules
// vendor is for libraries not available within npm
// components is for self written code
// new {} is for separate exported js files
//
// {
//   name: 'main',
//   deps: [
//     '~jquery/dist/jquery.min',
//     'vendor/my-lib'
//   ],
//   files: [
//     'components/foo',
//     'components/bar'
//   ]
// }
