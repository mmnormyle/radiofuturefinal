﻿using RadioFutureFinal.Models;
using System.Collections.Generic;

namespace RadioFutureFinal.Contracts
{
    public static class ExtensionMethods
    {
        public static SessionV1 ToContract(this Session session)
        {
            var sessionContract = new SessionV1()
            {
                Id = session.SessionID,
                Name = session.Name,
                Hits = session.Hits,
                Queue = new List<MediaV1>(),
                Locked = session.Locked
            };
            foreach(var media in session.Queue)
            {
                sessionContract.Queue.Add(media.ToContract());
            }
            return sessionContract;
        }

        public static Media ToModel(this MediaV1 media)
        {
            var mediaModel = new Media()
            {
                MediaID = media.Id,
                Title = media.Title,
                ThumbURL = media.ThumbURL,
                MP3Source = media.MP3Source,
                OGGSource = media.OGGSource,
                Description = media.Description,
                Show = media.Show
            };
            return mediaModel;
        }

        public static MediaV1 ToContract(this Media media)
        {
            var mediaContract = new MediaV1()
            {
                Id = media.MediaID,
                ThumbURL = media.ThumbURL,
                Title = media.Title,
                MP3Source = media.MP3Source,
                OGGSource = media.OGGSource,
                Description = media.Description,
                Show = media.Show
            };
            return mediaContract;
        }

    }
}
