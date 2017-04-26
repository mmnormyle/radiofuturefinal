﻿using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RadioFutureFinal.Contracts
{
    public class UserState
    {
        public UserState()
        {
            Time = 0;
            YTPlayerState = 0;
            Waiting = true;
            QueuePosition = -1;
        }

        [JsonProperty]
        public int Time { get; set; }

        [JsonProperty]
        public int QueuePosition { get; set; }

        [JsonProperty]
        public int YTPlayerState { get; set; }

        [JsonProperty]
        public bool Waiting { get; set; }
    }
}