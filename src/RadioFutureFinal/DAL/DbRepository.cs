﻿using RadioFutureFinal.Data;
using RadioFutureFinal.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace RadioFutureFinal.DAL
{
    public class DbRepository : IDbRepository
    {
        private readonly ApplicationDbContext _context;

        public DbRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User> AddNewUserToSession(string userName, Session session)
        {
            var user = new User(userName);
            session.Users.Add(user);
            await UpdateSessionAsync(session);
            return user;
        }

        public async Task RemoveUserAsync(User user)
        {
            _context.User.Remove(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateUserAsync(User user)
        {
            _context.User.Update(user);
            await _context.SaveChangesAsync();
        }

        public User GetUser(int userId)
        {
            return _context.User.FirstOrDefault(t => t.UserID == userId);
        }

        public IEnumerable<User> GetAllUsers()
        {
            return _context.User.ToList();
        }
        public async Task<Session> CreateSessionAsync(string sessionName)
        {
            var session = new Session(sessionName);
            _context.Session.Add(session);
            await _context.SaveChangesAsync();
            return sessionuserName
        }
        public async Task RemoveSessionAsync(Session session)
        {
            _context.Session.Remove(session);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateSessionAsync(Session session)
        {
            _context.Session.Update(session);
            await _context.SaveChangesAsync();
        }
        public Session GetSession(int sessionId)
        {
            return _context.Session.FirstOrDefault(t => t.SessionID == sessionId);
        }
        public bool GetSessionByName(string sessionName, out Session session)
        {
            session = _context.Session.FirstOrDefault(t => t.Name == sessionName);
            return session != null;
        }

        public IEnumerable<Session> GetAllSessions()
        {
            return _context.Session.ToList();
        }

        public async Task AddMediaAsync(Media media)
        {
            _context.Media.Add(media);
            await _context.SaveChangesAsync();
        }
        public async Task RemoveMediaAsync(Media media)
        {
            _context.Media.Remove(media);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateMediaAsync(Media media)
        {
            _context.Media.Update(media);
            await _context.SaveChangesAsync();
        }
        public Media GetMedia(int mediaId)
        {
            return _context.Media.FirstOrDefault(t => t.MediaID == mediaId);
        }
        public IEnumerable<Media> GetAllMedia()
        {
            return _context.Media.ToList();
        }
    }
}
