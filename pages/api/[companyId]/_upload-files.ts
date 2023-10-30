// Code used when pushing the form data through teh nextJs backend. Would need
// to be modified, but keeping it around in case we choose to go this route in the future.

// import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
// import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
// import nextConnect from 'next-connect';
// import multer from 'multer';
// import { Readable } from 'stream';
// import FormData from 'form-data';

// interface ExtendedFile extends Express.Multer.File {
//   buffer: Buffer;
//   originalname: string;
// }

// interface ExtendedNextApiRequest extends NextApiRequest {
//   files: ExtendedFile[];
// }

// // type ExtendedNextApiHandler = (
// //   req: ExtendedNextApiRequest,
// //   res: NextApiResponse
// // ) => void | Promise<void>;

// const upload = multer({ storage: multer.memoryStorage() });

// const apiRoute = nextConnect<NextApiRequest, NextApiResponse>({
//   onError(error, req, res) {
//     console.error('Error in API Route:', error);
//     res
//       .status(501)
//       .json({ error: `Sorry, an error occurred: ${error.message}` });
//   },
//   onNoMatch(req, res) {
//     res.status(405).json({ error: `Method ${req.method} not allowed` });
//   },
// });

// apiRoute.use(upload.array('files'));

// apiRoute.post(async (req, res) => {
//   res.status(200).json({ data: 'success' });

//   const companyId = req.query.companyId as string;
//   // try {

//   const session = await getSession(req, res);
//   if (!session || !session.user) {
//     res.status(401).json({ error: 'Not authenticated' });
//     return;
//   }

//   const formData = new FormData();
//   req.files.forEach((file) => {
//     const readableStream = new Readable({
//       read() {
//         this.push(file.buffer);
//         this.push(null);
//       },
//     });

//     formData.append('files', readableStream, {
//       filename: file.originalname,
//       contentType: file.mimetype,
//       knownLength: file.size,
//     });
//   });
// });
// //     const response = await fetch(
// //       `${api()}/${companyId}/upload-files`,
// //       {
// //         headers: {
// //                     Authorization: `Bearer ${googleToken}`,
//           Auth0: `Bearer ${auth0Session.accessToken}`,
// //         },
// //         method: 'POST',
// //         body: formData,
// //       }
// //     );

// //     response);

// //     if (!response.ok) {
// //       const errorData = await response.json();
// //       res.status(response.status).json({ error: errorData.detail });
// //       return;
// //     }
// //     const data = await response.json();
// //     res.status(response.status || 200).json(data);
// //   } catch (error: any) {
// //     console.error(error);
// //     res.status(error.status || 500).json({
// //       code: error.code,
// //       error: error.message,
// //     });
// //   }
// // });

// export default withApiAuthRequired(apiRoute);

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };
